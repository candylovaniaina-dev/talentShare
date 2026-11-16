<?php

namespace App\Services;

use App\Models\Mission;
use App\Models\ResourceOffer;
use App\Models\ResourceOfferWaitlist;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class TalentMarketService
{
    /** Statuts de mission qui "occupent" un talent */
    public const OCCUPYING = ['pending_employee', 'planned', 'active', 'trial'];

    /** Visibilités visibles par les autres entreprises */
    public const VISIBLE = ['public', 'companies'];

    /**
     * Sous-requête : profils occupés à une date donnée.
     * ⚠️ Seules les missions PRÊTÉES (supplying_company_id renseigné) occupent un talent.
     * Les missions internes (stage, CDI, recrutement) ne bloquent jamais le prêt.
     */
    public function occupiedProfileIdsQuery(?Carbon $onDate = null): Builder
    {
        $date = ($onDate ?? today())->toDateString();

        return Mission::query()
            ->select('professional_profile_id')
            ->whereNotNull('professional_profile_id')
            ->whereNotNull('supplying_company_id')
            ->whereIn('status', self::OCCUPYING)
            ->where(fn ($q) => $q->whereNull('end_at')->orWhere('end_at', '>=', $date));
    }

    /** 
     * ✅ NOUVEAU : Le marché ne contient que des salariés en CDI de l'entreprise qui les propose 
     */
    public function onlyLendable(Builder $q): Builder
    {
        return $q->whereExists(function ($sub) {
            $sub->selectRaw('1')
                ->from('employees')
                ->join('professional_profiles', 'professional_profiles.user_id', '=', 'employees.user_id')
                ->whereColumn('professional_profiles.id', 'resource_offers.professional_profile_id')
                ->whereColumn('employees.company_id', 'resource_offers.company_id')
                ->whereNull('employees.deleted_at')
                ->where(fn ($w) => $w->whereNull('employees.contract_type')->orWhere('employees.contract_type', 'permanent'));
        });
    }

    /** Missions de prêt en cours, groupées par profil */
    public function missionsByProfile(array $profileIds, bool $withClient = false): Collection
    {
        if (empty($profileIds)) {
            return collect();
        }

        $q = Mission::query()
            ->whereIn('professional_profile_id', $profileIds)
            ->whereNotNull('supplying_company_id')
            ->whereIn('status', self::OCCUPYING)
            ->where(fn ($q) => $q->whereNull('end_at')->orWhere('end_at', '>=', today()->toDateString()));

        if ($withClient) {
            $q->with('requestingCompany:id,name');
        }

        return $q->get()->groupBy('professional_profile_id');
    }

    /** Déduit l'état d'un talent à partir de ses missions de prêt */
    public function resolve(?Collection $missions): array
    {
        if (!$missions || $missions->isEmpty()) {
            return ['state' => 'available', 'available_from' => null, 'indefinite' => false, 'mission' => null];
        }

        $today      = today();
        $reserved   = $missions->contains(fn ($m) => $m->status === 'pending_employee' || ($m->start_at && $m->start_at->gt($today)));
        $indefinite = $missions->contains(fn ($m) => $m->end_at === null);
        $latest     = $missions->whereNotNull('end_at')->sortByDesc('end_at')->first();

        return [
            'state'          => $reserved ? 'reserved' : 'on_mission',
            'available_from' => ($indefinite || !$latest) ? null : $latest->end_at->copy()->addDay()->toDateString(),
            'indefinite'     => $indefinite,
            'mission'        => $latest ?? $missions->first(),
        ];
    }

    public function stateFor(ResourceOffer $offer): array
    {
        $missions = $this->missionsByProfile([$offer->professional_profile_id])->get($offer->professional_profile_id);

        return $this->resolve($missions);
    }

    /** Appelé quand une mission change : prévient les entreprises en attente */
    public function syncProfile(int $profileId): void
    {
        ResourceOffer::where('professional_profile_id', $profileId)
            ->where('status', 'published')
            ->get()
            ->each(fn ($offer) => $this->syncOffer($offer));
    }

    public function syncOffer(ResourceOffer $offer): void
    {
        $entries = ResourceOfferWaitlist::where('resource_offer_id', $offer->id)
            ->whereIn('status', ResourceOfferWaitlist::ACTIVE)
            ->with(['company.owner', 'user'])
            ->get();

        if ($entries->isEmpty()) {
            return;
        }

        $offer->loadMissing(['profile.user', 'company']);
        $missions   = $this->missionsByProfile([$offer->professional_profile_id])->get($offer->professional_profile_id);
        $info       = $this->resolve($missions);
        $expired    = $offer->end_at && $offer->end_at->lt(today());
        $talentName = $offer->profile?->user?->name ?? 'Le talent';
        $lender     = $offer->company?->name ?? 'son entreprise';

        // 1) Le talent est libre → on prévient ceux qui attendaient
        if ($info['state'] === 'available' && !$expired && $offer->status === 'published') {
            foreach ($entries->where('status', 'waiting') as $entry) {
                $entry->update(['status' => 'notified', 'notified_at' => now()]);

                $this->notifyEntry(
                    $entry, 'talent_available',
                    "🎉 {$talentName} est de nouveau disponible",
                    "Le talent que vous attendiez chez {$lender} vient de se libérer. Soyez le premier à le proposer.",
                    $offer,
                    ['url' => '/resource-offers/browse?offer=' . $offer->id]
                );
            }

            return;
        }

        // 2) Le talent vient d'être pris → on prévient ceux qui avaient été notifiés
        foreach ($entries->where('status', 'notified') as $entry) {
            $taken = $missions?->contains(fn ($m) => (int) $m->requesting_company_id === (int) $entry->company_id);

            if ($taken) {
                $entry->update(['status' => 'converted']);
                continue;
            }

            $entry->update(['status' => 'lost']);

            $alts  = $this->alternativesFor($offer, [$entry->company_id, $offer->company_id], 3);
            $names = $alts->map(fn ($a) => ($a->profile?->user?->name ?? 'Talent') . ' (' . ($a->company?->name ?? '—') . ')')->implode(', ');

            $this->notifyEntry(
                $entry, 'talent_unavailable',
                "{$talentName} n'est plus disponible",
                "{$talentName} vient d'être placé sur une autre mission." .
                    ($names ? " Profils similaires disponibles : {$names}." : " Explorez le marché pour d'autres profils."),
                $offer,
                ['url' => '/resource-offers/browse?offer=' . ($alts->first()?->id ?? $offer->id), 'alternatives' => $alts->pluck('id')->all()]
            );
        }
    }

    /** Talents disponibles, proches par compétences, chez d'autres entreprises */
    public function alternativesFor(ResourceOffer $offer, array $excludeCompanyIds = [], int $limit = 6): Collection
    {
        $skillIds = $offer->skills()->pluck('skills.id')->all();

        $q = ResourceOffer::query()->published()->whereIn('visibility', self::VISIBLE)
            ->where('id', '!=', $offer->id)
            ->where('professional_profile_id', '!=', $offer->professional_profile_id)
            ->whereNotIn('professional_profile_id', $this->occupiedProfileIdsQuery())
            ->with(['company:id,name,logo_path,city,country,is_verified,owner_user_id', 'profile.user:id,name,first_name,last_name', 'skills']);

        // ✅ NOUVEAU : Filtre pour ne garder que les CDI de l'entreprise
        $this->onlyLendable($q);

        if (!empty($excludeCompanyIds)) {
            $q->whereNotIn('company_id', $excludeCompanyIds);
        }

        return $q->limit(80)->get()
            ->map(function ($o) use ($skillIds, $offer) {
                $common = $o->skills->pluck('id')->intersect($skillIds)->count();
                $o->setAttribute('alt_score', $common * 10 + ($o->mission_type === $offer->mission_type ? 3 : 0));

                return $o;
            })
            ->filter(fn ($o) => $o->alt_score > 0 || empty($skillIds))
            ->sortByDesc('alt_score')
            ->take($limit)
            ->values();
    }

    /** Notifie l'auteur de l'inscription et le propriétaire de l'entreprise */
    public function notifyEntry(ResourceOfferWaitlist $entry, string $type, string $title, string $body, ResourceOffer $offer, array $data = []): void
    {
        $notifications = app(NotificationService::class);

        collect([$entry->company?->owner, $entry->user])
            ->filter()
            ->unique('id')
            ->each(function ($user) use ($notifications, $type, $title, $body, $offer, $data) {
                try {
                    $notifications->notify($user, $type, $title, $body, $offer, $data);
                } catch (\Throwable $e) {
                    \Log::warning('Notif talent-market: ' . $e->getMessage());
                }
            });
    }
}