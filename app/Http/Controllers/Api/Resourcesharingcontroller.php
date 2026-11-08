<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mission;
use App\Models\ProfessionalProfile;
use App\Models\Proposal;
use App\Models\ResourceOffer;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;

/**
 * P0-7 Resource Sharing : une entreprise déclare un salarié disponible,
 * les autres entreprises recherchent et consultent.
 */
class ResourceSharingController extends Controller
{
    public const MISSION_TYPES = ['full_time', 'part_time', 'freelance', 'mission', 'loan'];
    public const LOCATION_TYPES = ['onsite', 'remote', 'hybrid'];
    public const UNITS = ['percentage', 'hours_per_week', 'days_per_week'];
    public const VISIBILITIES = ['public', 'companies', 'private'];
    public const MISSION_STATUSES = ['pending_employee', 'planned', 'active'];

    // ============================================
    // BROWSE (public, auth optionnelle)
    // ============================================
    public function browse(Request $request)
    {
        $user = $request->user('sanctum');
        $myIds = $user ? $user->companies()->pluck('id')->all() : [];

        $busy = Mission::whereNotNull('resource_offer_id')
            ->whereIn('status', self::MISSION_STATUSES)
            ->select('resource_offer_id');

        $q = ResourceOffer::query()
            ->with([
                'company:id,name,logo_path,owner_user_id',
                'profile:id,user_id,headline,avatar_path',
                'profile.user:id,name',
                'skills:id,name',
            ])
            ->where('status', 'published')
            ->whereDate('end_at', '>=', now()->toDateString())
            ->whereNotIn('id', $busy)
            ->where(function ($v) use ($myIds) {
                $v->where('visibility', 'public');
                if (!empty($myIds)) {
                    $v->orWhere('visibility', 'companies');
                }
            });

        if (!empty($myIds)) {
            $q->whereNotIn('company_id', $myIds);
        }

        if ($s = trim((string) $request->query('q'))) {
            $like = '%' . $s . '%';
            $q->where(function ($w) use ($like) {
                $w->where('title', 'ilike', $like)
                    ->orWhere('description', 'ilike', $like)
                    ->orWhereHas('profile', fn ($p) => $p->where('headline', 'ilike', $like)
                        ->orWhereHas('user', fn ($u) => $u->where('name', 'ilike', $like)))
                    ->orWhereHas('skills', fn ($k) => $k->where('name', 'ilike', $like));
            });
        }

        if ($skill = trim((string) $request->query('skill'))) {
            $q->whereHas('skills', fn ($k) => $k->where('name', 'ilike', '%' . $skill . '%'));
        }
        if ($t = $request->query('mission_type')) {
            $q->where('mission_type', $t);
        }
        if ($t = $request->query('location_type')) {
            $q->where('location_type', $t);
        }
        if ($city = trim((string) $request->query('city'))) {
            $q->where('location_city', 'ilike', '%' . $city . '%');
        }
        if (($max = $request->query('rate_max')) !== null && $max !== '') {
            // un tarif non renseigné = "à discuter" : on le garde
            $q->where(fn ($w) => $w->whereNull('daily_rate')->orWhere('daily_rate', '<=', (int) $max));
        }
        if ($from = $request->query('from')) {
            $q->whereDate('end_at', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $q->whereDate('start_at', '<=', $to);
        }

        match ($request->query('sort')) {
            'start'     => $q->orderBy('start_at'),
            'rate_asc'  => $q->orderByRaw('daily_rate asc nulls last'),
            'rate_desc' => $q->orderByRaw('daily_rate desc nulls last'),
            default     => $q->latest(),
        };

        $page = $q->paginate(12)->withQueryString();
        $items = $page->getCollection();

        $proposed = [];
        if (!empty($myIds) && $items->isNotEmpty()) {
            $proposed = Proposal::whereIn('resource_offer_id', $items->pluck('id'))
                ->whereIn('proposed_by_company_id', $myIds)
                ->whereNotIn('status', ['cancelled', 'declined', 'expired'])
                ->pluck('resource_offer_id')->all();
        }

        $items->each(function ($o) use ($proposed) {
            $this->decorate($o);
            $o->setAttribute('already_proposed', in_array($o->id, $proposed));
        });

        return response()->json($page);
    }

    // ============================================
    // MES OFFRES
    // ============================================
    public function mine(Request $request)
    {
        $companies = $request->user()->companies()->get(['id', 'name']);
        if ($companies->isEmpty()) {
            return response()->json(['has_company' => false, 'offers' => [], 'companies' => []]);
        }

        $offers = ResourceOffer::whereIn('company_id', $companies->pluck('id'))
            ->with([
                'company:id,name',
                'profile:id,user_id,headline,avatar_path',
                'profile.user:id,name',
                'skills:id,name',
            ])
            ->latest()->get();

        $ids = $offers->pluck('id');
        $missions = Mission::whereIn('resource_offer_id', $ids)
            ->whereIn('status', self::MISSION_STATUSES)->get()->keyBy('resource_offer_id');

        $counts = Proposal::whereIn('resource_offer_id', $ids)
            ->where('status', '!=', 'draft')
            ->selectRaw("resource_offer_id, count(*) as total, sum(case when status in ('sent','viewed') then 1 else 0 end) as pending")
            ->groupBy('resource_offer_id')->get()->keyBy('resource_offer_id');

        $offers->each(function ($o) use ($missions, $counts) {
            $this->decorate($o, $missions);
            $o->setAttribute('proposals_count', (int) ($counts[$o->id]->total ?? 0));
            $o->setAttribute('pending_proposals_count', (int) ($counts[$o->id]->pending ?? 0));
        });

        return response()->json(['has_company' => true, 'offers' => $offers, 'companies' => $companies]);
    }

    // ============================================
    // SHOW (public, auth optionnelle)
    // ============================================
    public function show(Request $request, ResourceOffer $offer)
    {
        $user = $request->user('sanctum');
        $myIds = $user ? $user->companies()->pluck('id')->all() : [];
        $isOwner = in_array($offer->company_id, $myIds);

        $myProposals = empty($myIds) ? collect() : Proposal::where('resource_offer_id', $offer->id)
            ->whereIn('proposed_by_company_id', $myIds)
            ->whereNotIn('status', ['cancelled', 'declined', 'expired'])
            ->pluck('proposed_by_company_id');

        if (!$isOwner) {
            $visible = ($offer->status === 'published' && match ($offer->visibility ?? 'public') {
                'public'    => true,
                'companies' => !empty($myIds),
                default     => false,
            }) || $myProposals->isNotEmpty();

            abort_unless($visible, 404, 'Offre introuvable.');
            ResourceOffer::whereKey($offer->id)->increment('views_count');
        }

        $offer->load([
            'company:id,name,logo_path,owner_user_id',
            'profile:id,user_id,headline,avatar_path,bio',
            'profile.user:id,name',
            'profile.skills',
            'skills:id,name',
        ]);

        $this->decorate($offer);
        $offer->setAttribute('is_owner', $isOwner);
        $offer->setAttribute('already_proposed_companies', $myProposals->values());

        return response()->json($offer);
    }

    // ============================================
    // SALARIÉS PARTAGEABLES DE MON ENTREPRISE
    // ============================================
    public function employees(Request $request)
    {
        $company = $this->ownedCompany($request, $request->query('company_id'));

        $rows = $company->employees()
            ->where('status', 'active')
            ->with('user.professionalProfile.skills')
            ->get()
            ->map(function ($e) {
                $profile = $e->user?->professionalProfile;
                $name = trim(($e->first_name ?? '') . ' ' . ($e->last_name ?? ''));

                return [
                    'id'                      => $e->id,
                    'name'                    => $name ?: ($e->user?->name ?? 'Salarié'),
                    'position'                => $e->position,
                    'professional_profile_id' => $profile?->id,
                    'avatar_path'             => $profile?->avatar_path,
                    'headline'                => $profile?->headline,
                    'shareable'               => (bool) $profile,
                    'skills'                  => $profile
                        ? $profile->skills->map(fn ($s) => [
                            'id' => $s->id, 'name' => $s->name, 'level' => $s->pivot->level ?? null,
                        ])->values()
                        : [],
                ];
            })->values();

        return response()->json($rows);
    }

    // ============================================
    // STORE / UPDATE / STATUS / DESTROY
    // ============================================
    public function store(Request $request)
    {
        $data = $request->validate(array_merge($this->rules(), [
            'company_id'              => ['required', 'exists:companies,id'],
            'professional_profile_id' => ['required', 'exists:professional_profiles,id'],
        ]));

        $company = $this->ownedCompany($request, $data['company_id']);
        $profile = ProfessionalProfile::findOrFail($data['professional_profile_id']);

        if (!$company->employees()->where('user_id', $profile->user_id)->exists()) {
            return response()->json(['message' => "Ce profil n'est pas un salarié de cette entreprise."], 422);
        }
        if ($err = $this->workloadError($data)) {
            return response()->json(['message' => $err, 'errors' => ['workload_value' => [$err]]], 422);
        }
        if ($data['status'] === 'published' && ($c = $this->conflict($profile->id, $data))) {
            return response()->json($c, 409);
        }

        $offer = new ResourceOffer();
        $offer->forceFill([
            ...Arr::except($data, ['skill_ids']),
            'company_id'              => $company->id,
            'professional_profile_id' => $profile->id,
            'published_at'            => $data['status'] === 'published' ? now() : null,
        ])->save();

        $offer->skills()->sync($this->allowedSkillIds($profile, $data['skill_ids'] ?? []));

        return response()->json($this->fresh($offer), 201);
    }

    public function update(Request $request, ResourceOffer $offer)
    {
        $this->authorizeOwner($request, $offer);

        if ($this->activeMission($offer->id)) {
            return response()->json(['message' => 'Une mission est liée à cette offre : elle ne peut plus être modifiée.'], 409);
        }

        $rules = $this->rules();
        $rules['status'] = ['sometimes', Rule::in(['draft', 'published', 'closed'])];
        $data = $request->validate($rules);

        if ($err = $this->workloadError($data)) {
            return response()->json(['message' => $err, 'errors' => ['workload_value' => [$err]]], 422);
        }

        $newStatus = $data['status'] ?? $offer->status;
        if ($newStatus === 'published' && ($c = $this->conflict($offer->professional_profile_id, $data, $offer->id))) {
            return response()->json($c, 409);
        }

        $payload = Arr::except($data, ['skill_ids']);
        if ($newStatus === 'published' && !$offer->published_at) {
            $payload['published_at'] = now();
        }
        $offer->forceFill($payload)->save();

        if (array_key_exists('skill_ids', $data) && $offer->profile) {
            $offer->skills()->sync($this->allowedSkillIds($offer->profile, $data['skill_ids'] ?? []));
        }

        return response()->json($this->fresh($offer));
    }

    public function setStatus(Request $request, ResourceOffer $offer)
    {
        $this->authorizeOwner($request, $offer);
        $data = $request->validate(['status' => ['required', Rule::in(['draft', 'published', 'closed'])]]);

        if ($this->activeMission($offer->id)) {
            return response()->json(['message' => 'Une mission est en cours pour cette offre.'], 409);
        }

        if ($data['status'] === 'published') {
            $period = ['start_at' => $offer->start_at, 'end_at' => $offer->end_at];
            if (Carbon::parse($offer->end_at)->lt(today())) {
                return response()->json(['message' => 'La période est dépassée : modifiez les dates avant de publier.'], 409);
            }
            if ($c = $this->conflict($offer->professional_profile_id, $period, $offer->id)) {
                return response()->json($c, 409);
            }
        }

        $offer->forceFill([
            'status'       => $data['status'],
            'published_at' => $data['status'] === 'published' ? ($offer->published_at ?? now()) : $offer->published_at,
        ])->save();

        return response()->json($this->fresh($offer));
    }

    public function destroy(Request $request, ResourceOffer $offer)
    {
        $this->authorizeOwner($request, $offer);

        if ($this->activeMission($offer->id)) {
            return response()->json(['message' => 'Une mission est liée à cette offre.'], 409);
        }
        if (Proposal::where('resource_offer_id', $offer->id)->exists()) {
            return response()->json(['message' => 'Des propositions existent pour cette offre : clôturez-la plutôt que de la supprimer.'], 409);
        }

        $offer->skills()->detach();
        $offer->delete();

        return response()->json(['message' => 'Offre supprimée.']);
    }

    // ============================================
    // PROPOSITIONS REÇUES SUR UNE OFFRE (propriétaire)
    // ============================================
    public function proposals(Request $request, ResourceOffer $offer)
    {
        $this->authorizeOwner($request, $offer);

        return Proposal::where('resource_offer_id', $offer->id)
            ->where('status', '!=', 'draft') // un brouillon n'est jamais visible du destinataire
            ->with([
                'proposingCompany:id,name,logo_path',
                'documents:id,documentable_id,documentable_type,type,file_path,status',
            ])
            ->latest()->get()
            ->map(fn ($p) => $p->append(['display_status', 'status_label', 'days_until_expiry', 'is_pending']));
    }

    // ============================================
    // HELPERS
    // ============================================
    private function rules(): array
    {
        return [
            'title'         => ['required', 'string', 'max:150'],
            'description'   => ['required', 'string', 'min:20', 'max:5000'],
            'mission_type'  => ['required', Rule::in(self::MISSION_TYPES)],
            'start_at'      => ['required', 'date'],
            'end_at'        => ['required', 'date', 'after_or_equal:start_at'],
            'workload_value' => ['required', 'integer', 'min:1'],
            'workload_unit' => ['required', Rule::in(self::UNITS)],
            'location_type' => ['required', Rule::in(self::LOCATION_TYPES)],
            'location_city' => ['nullable', 'string', 'max:120'],
            'daily_rate'    => ['nullable', 'integer', 'min:0'],
            'conditions'    => ['nullable', 'string', 'max:3000'],
            'visibility'    => ['required', Rule::in(self::VISIBILITIES)],
            'status'        => ['required', Rule::in(['draft', 'published'])],
            'skill_ids'     => ['nullable', 'array'],
            'skill_ids.*'   => ['integer', 'exists:skills,id'],
        ];
    }

    private function workloadError(array $d): ?string
    {
        $limits = ['percentage' => [100, '%'], 'hours_per_week' => [80, 'h/semaine'], 'days_per_week' => [7, 'j/semaine']];
        [$max, $label] = $limits[$d['workload_unit']] ?? [100, '%'];

        return ((int) $d['workload_value']) > $max ? "La charge ne peut pas dépasser {$max} {$label}." : null;
    }

    /** Le salarié est-il déjà engagé (mission ou autre offre publiée) sur cette période ? */
    private function conflict(int $profileId, array $d, ?int $ignoreOfferId = null): ?array
    {
        $start = $d['start_at'];
        $end = $d['end_at'];

        $mission = Mission::where('professional_profile_id', $profileId)
            ->whereIn('status', ['pending_employee', 'planned', 'active', 'trial'])
            ->where('start_at', '<=', $end)
            ->where(fn ($q) => $q->whereNull('end_at')->orWhere('end_at', '>=', $start))
            ->exists();

        if ($mission) {
            return ['message' => 'Ce salarié a déjà une mission sur cette période.', 'code' => 'mission_overlap'];
        }

        $offer = ResourceOffer::where('professional_profile_id', $profileId)
            ->where('status', 'published')
            ->when($ignoreOfferId, fn ($q) => $q->where('id', '!=', $ignoreOfferId))
            ->where('start_at', '<=', $end)->where('end_at', '>=', $start)
            ->exists();

        return $offer
            ? ['message' => 'Ce salarié a déjà une offre publiée sur cette période.', 'code' => 'offer_overlap']
            : null;
    }

    private function allowedSkillIds(ProfessionalProfile $profile, array $wanted): array
    {
        $own = $profile->skills()->pluck('skills.id')->all();
        $picked = array_values(array_intersect($own, array_map('intval', $wanted)));

        return $picked ?: $own;
    }

    private function activeMission(int $offerId): ?Mission
    {
        return Mission::where('resource_offer_id', $offerId)
            ->whereIn('status', self::MISSION_STATUSES)->latest()->first();
    }

    private function ownedCompany(Request $request, $companyId)
    {
        $q = $request->user()->companies();
        $company = $companyId ? $q->where('companies.id', $companyId)->first() : $q->first();
        abort_unless($company, 403, "Cette entreprise ne vous appartient pas.");

        return $company;
    }

    private function authorizeOwner(Request $request, ResourceOffer $offer): void
    {
        abort_unless(
            $request->user()->companies()->where('companies.id', $offer->company_id)->exists(),
            403,
            "Seule l'entreprise propriétaire peut gérer cette offre."
        );
    }

    private function fresh(ResourceOffer $offer): ResourceOffer
    {
        $offer = $offer->fresh([
            'company:id,name,logo_path,owner_user_id',
            'profile:id,user_id,headline,avatar_path',
            'profile.user:id,name',
            'skills:id,name',
        ]);

        return $this->decorate($offer);
    }

    /** Ajoute display_status + active_mission (utilisés par le front). */
    private function decorate(ResourceOffer $o, $missions = null): ResourceOffer
    {
        $m = $missions ? $missions->get($o->id) : $this->activeMission($o->id);

        $display = $o->status;
        if ($m) {
            $display = ['pending_employee' => 'mission_pending', 'planned' => 'mission_planned', 'active' => 'mission_active'][$m->status] ?? $o->status;
        } elseif ($o->status === 'published' && $o->end_at && Carbon::parse($o->end_at)->lt(today())) {
            $display = 'expired';
        }

        $o->setAttribute('display_status', $display);
        $o->setAttribute('active_mission', $m ? ['id' => $m->id, 'status' => $m->status] : null);

        return $o;
    }
}