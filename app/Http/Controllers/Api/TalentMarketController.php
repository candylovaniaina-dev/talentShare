<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Mission;
use App\Models\Proposal;
use App\Models\ResourceOffer;
use App\Models\ResourceOfferWaitlist;
use App\Models\Skill;
use App\Models\SkillCategory;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\TalentMarketService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TalentMarketController extends Controller
{
    private const COMPANY_COLS = 'company:id,name,logo_path,city,country,is_verified,owner_user_id';

    private const LENDABLE_CONTRACTS = ['permanent'];

    public function __construct(private TalentMarketService $market) {}

    private function getAllMyCompanyIds(Request $request): array
    {
        $user = $request->user();

        return $user->ownedCompanies()->pluck('companies.id')
            ->merge($user->memberCompanies()->pluck('companies.id'))
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }

    public function index(Request $request)
    {
        $myIds = $this->getAllMyCompanyIds($request);

        $base = ResourceOffer::query()->published()->whereIn('visibility', TalentMarketService::VISIBLE)
            ->when($myIds, fn ($q) => $q->whereNotIn('company_id', $myIds));
        
        $this->market->onlyLendable($base);

        $this->applyFilters($base, $request);

        $occupied = $this->market->occupiedProfileIdsQuery();

        $all       = (clone $base)->count();
        $available = (clone $base)->whereNotIn('professional_profile_id', $occupied)->count();

        $query = clone $base;
        // ✅ CORRECTION : On ne filtre plus par défaut. Le filtre ne s'applique que si state est renseigné.
        
        if ($request->filled('available_by')) {
            $query->whereNotIn('professional_profile_id', $this->market->occupiedProfileIdsQuery(Carbon::parse($request->available_by)));
        } elseif ($request->state === 'available') {
            $query->whereNotIn('professional_profile_id', $occupied);
        } elseif ($request->state === 'busy') {
            $query->whereIn('professional_profile_id', $occupied);
        }

        match ($request->get('sort', 'recent')) {
            'availability' => $query->orderByRaw(
                "CASE WHEN professional_profile_id IN ({$occupied->toSql()}) THEN 1 ELSE 0 END",
                $occupied->getBindings()
            )->latest(),
            'rate_asc'  => $query->orderByRaw('daily_rate ASC NULLS LAST')->latest(),
            'rate_desc' => $query->orderByRaw('daily_rate DESC NULLS LAST')->latest(),
            default     => $query->latest(),
        };

        $page = $query->with([self::COMPANY_COLS, 'profile.user:id,name,first_name,last_name', 'skills'])
            ->paginate(min((int) $request->get('per_page', 24), 60));

        $items = collect($page->items());
        $ctx   = $this->context($items, $myIds);

        return response()->json([
            'data' => $items->map(fn ($o) => $this->present($o, $ctx))->values(),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page'    => $page->lastPage(),
                'total'        => $page->total(),
                'counts'       => ['all' => $all, 'available' => $available, 'busy' => $all - $available],
            ],
        ]);
    }

    public function show(Request $request, ResourceOffer $offer)
    {
        $myIds   = $this->getAllMyCompanyIds($request);
        $isOwner = in_array($offer->company_id, $myIds);

        if (!$isOwner && ($offer->status !== 'published' || !in_array($offer->visibility, TalentMarketService::VISIBLE, true))) {
            abort(404);
        }

        $offer->load([
            self::COMPANY_COLS, 
            'profile.user:id,name,first_name,last_name', 
            'profile.portfolio',
            'skills'
        ]);
        
        $ctx  = $this->context(collect([$offer]), $myIds);
        $item = $this->present($offer, $ctx, true);

        $eligible = array_values(array_map('intval', array_diff($myIds, [$offer->company_id], $item['proposed_company_ids'])));

        $myWaiting = ResourceOfferWaitlist::where('resource_offer_id', $offer->id)
            ->whereIn('company_id', $myIds)->whereIn('status', ResourceOfferWaitlist::ACTIVE)->get()
            ->map(fn ($e) => [
                'company_id' => (int) $e->company_id,
                'status'     => $e->status,
                'position'   => $this->position($e),
            ])->values();

        return response()->json([
            'offer'                => $item,
            'is_owner'             => $isOwner,
            'eligible_company_ids' => $eligible,
            'can_propose'          => !$isOwner && $item['state'] === 'available' && !empty($eligible),
            'my_waiting'           => $myWaiting,
            'waiting_companies'    => $isOwner ? $this->waitingCompanies($offer) : [],
        ]);
    }

    public function alternatives(Request $request, ResourceOffer $offer)
    {
        $myIds = $this->getAllMyCompanyIds($request);
        $alts  = $this->market->alternativesFor($offer, array_merge($myIds, [$offer->company_id]), 6);
        $ctx   = $this->context($alts, $myIds);

        return response()->json(['data' => $alts->map(fn ($o) => $this->present($o, $ctx))->values()]);
    }

    public function joinWaitlist(Request $request, ResourceOffer $offer, NotificationService $notifications)
    {
        $data = $request->validate([
            'company_id'       => ['required', 'exists:companies,id'],
            'message'          => ['nullable', 'string', 'max:1000'],
            'desired_start_at' => ['nullable', 'date'],
        ]);

        $user = $request->user();
        $company = $user->ownedCompanies()->find($data['company_id']) 
                ?? $user->memberCompanies()->find($data['company_id']);

        if (!$company) {
            return response()->json(['message' => 'Cette entreprise ne vous appartient pas.'], 403);
        }
        if ((int) $offer->company_id === (int) $company->id) {
            return response()->json(['message' => 'Vous ne pouvez pas attendre votre propre talent.'], 403);
        }
        if ($offer->status !== 'published' || ($offer->end_at && $offer->end_at->lt(today()))) {
            return response()->json(['message' => "Ce talent n'est plus proposé sur le marché.", 'code' => 'offer_closed'], 409);
        }

        $info = $this->market->stateFor($offer);
        if ($info['state'] === 'available') {
            return response()->json(['message' => 'Ce talent est disponible : vous pouvez le proposer directement.', 'code' => 'talent_available'], 409);
        }

        $entry = ResourceOfferWaitlist::where('resource_offer_id', $offer->id)
            ->where('company_id', $company->id)
            ->first();

        if ($entry && in_array($entry->status, ResourceOfferWaitlist::ACTIVE)) {
            return response()->json(['message' => 'Votre entreprise est déjà sur la liste d\'attente.', 'code' => 'already_waiting'], 409);
        }

        if ($entry) {
            $entry->update([
                'user_id'          => $user->id,
                'status'           => 'waiting',
                'message'          => $data['message'] ?? null,
                'desired_start_at' => $data['desired_start_at'] ?? null,
                'notified_at'      => null,
                'created_at'       => now(),
            ]);
        } else {
            $entry = ResourceOfferWaitlist::create([
                'resource_offer_id' => $offer->id,
                'company_id'        => $company->id,
                'user_id'           => $user->id,
                'status'            => 'waiting',
                'message'           => $data['message'] ?? null,
                'desired_start_at'  => $data['desired_start_at'] ?? null,
            ]);
        }

        $offer->loadMissing(['company.owner', 'profile.user']);
        try {
            if ($offer->company?->owner) {
                // ✅ CORRECTION : L'URL inclut l'ID de l'offre pour ouvrir le tiroir
                $notifications->notify(
                    $offer->company->owner, 'talent_waitlist_joined',
                    '⏳ Une entreprise attend votre talent',
                    "{$company->name} a rejoint la liste d'attente pour " . ($offer->profile?->user?->name ?? 'votre talent') . '.',
                    $offer, ['url' => '/resource-offers/browse?tab=pool&offer=' . $offer->id]
                );
            }
        } catch (\Throwable $e) {
            \Log::warning('Notif waitlist: ' . $e->getMessage());
        }

        return response()->json(['entry_id' => $entry->id, 'position' => $this->position($entry)], 201);
    }

    public function leaveWaitlist(Request $request, ResourceOffer $offer)
    {
        $request->validate(['company_id' => ['required', 'exists:companies,id']]);

        $user = $request->user();
        $company = $user->ownedCompanies()->find($request->company_id) 
                ?? $user->memberCompanies()->find($request->company_id);
        
        abort_unless($company, 403, 'Cette entreprise ne vous appartient pas.');

        ResourceOfferWaitlist::where('resource_offer_id', $offer->id)
            ->where('company_id', $company->id)
            ->whereIn('status', ResourceOfferWaitlist::ACTIVE)
            ->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Vous avez quitté la liste d\'attente.']);
    }

    public function myWaitlist(Request $request)
    {
        $myIds = $this->getAllMyCompanyIds($request);
        if (empty($myIds)) {
            return response()->json(['data' => []]);
        }

        $entries = ResourceOfferWaitlist::whereIn('company_id', $myIds)
            ->where(function ($q) {
                $q->whereIn('status', ResourceOfferWaitlist::ACTIVE)
                  ->orWhere(fn ($s) => $s->whereIn('status', ['lost', 'converted'])->where('updated_at', '>=', now()->subDays(30)));
            })
            ->with(['company:id,name', 'offer.' . self::COMPANY_COLS, 'offer.profile.user:id,name,first_name,last_name', 'offer.skills'])
            ->latest('updated_at')->get()
            ->filter(fn ($e) => $e->offer);

        $ctx = $this->context($entries->pluck('offer')->unique('id')->values(), $myIds);

        return response()->json(['data' => $entries->map(fn ($e) => [
            'id'               => $e->id,
            'status'           => $e->status,
            'position'         => in_array($e->status, ResourceOfferWaitlist::ACTIVE) ? $this->position($e) : null,
            'company'          => ['id' => $e->company_id, 'name' => $e->company?->name],
            'message'          => $e->message,
            'desired_start_at' => $e->desired_start_at?->toDateString(),
            'created_at'       => $e->created_at?->toIso8601String(),
            'offer'            => $this->present($e->offer, $ctx),
        ])->values()]);
    }

    public function offerWaitlist(Request $request, ResourceOffer $offer)
    {
        $myIds = $this->getAllMyCompanyIds($request);
        abort_unless(in_array($offer->company_id, $myIds), 403, 'Non autorisé.');

        return response()->json(['data' => ResourceOfferWaitlist::where('resource_offer_id', $offer->id)
            ->whereIn('status', ResourceOfferWaitlist::ACTIVE)
            ->with('company:id,name,logo_path')->oldest()->get()
            ->map(fn ($e) => [
                'id'               => $e->id,
                'company'          => ['id' => $e->company_id, 'name' => $e->company?->name, 'logo_url' => $e->company?->logo_url],
                'status'           => $e->status,
                'message'          => $e->message,
                'desired_start_at' => $e->desired_start_at?->toDateString(),
                'created_at'       => $e->created_at?->toIso8601String(),
            ])->values()]);
    }

    public function pool(Request $request)
    {
        $user = $request->user();
        $companies = $user->ownedCompanies()->get()->merge($user->memberCompanies()->get())->unique('id');
        
        if ($companies->isEmpty()) {
            return response()->json(['has_company' => false, 'employees' => [], 'borrowed' => [], 'summary' => []]);
        }

        $company = $request->filled('company_id') ? $companies->firstWhere('id', (int) $request->company_id) : $companies->first();
        abort_unless($company, 403, 'Cette entreprise ne vous appartient pas.');

        $employees  = Employee::where('company_id', $company->id)->with('user.professionalProfile.skills')->orderBy('first_name')->get();
        $profileIds = $employees->map(fn ($e) => $e->user?->professionalProfile?->id)->filter()->unique()->values()->all();

        $offers = ResourceOffer::where('company_id', $company->id)
            ->whereIn('professional_profile_id', $profileIds)
            ->whereIn('status', ['draft', 'published'])
            ->orderByDesc('id')->get()
            ->groupBy('professional_profile_id')
            ->map(fn ($g) => $g->firstWhere('status', 'published') ?? $g->first());

        $offerIds = $offers->pluck('id')->all();
        $waitCounts = ResourceOfferWaitlist::whereIn('resource_offer_id', $offerIds)->whereIn('status', ResourceOfferWaitlist::ACTIVE)
            ->selectRaw('resource_offer_id, count(*) as c')->groupBy('resource_offer_id')->pluck('c', 'resource_offer_id');
        $pending = Proposal::whereIn('resource_offer_id', $offerIds)->whereIn('status', ['sent', 'viewed'])
            ->selectRaw('resource_offer_id, count(*) as c')->groupBy('resource_offer_id')->pluck('c', 'resource_offer_id');

        $loans = $this->market->missionsByProfile($profileIds, true);

        $contracts = Mission::query()
            ->whereIn('professional_profile_id', $profileIds)
            ->where('requesting_company_id', $company->id)
            ->whereNull('supplying_company_id')
            ->whereIn('status', TalentMarketService::OCCUPYING)
            ->where(fn ($q) => $q->whereNull('end_at')->orWhere('end_at', '>=', today()->toDateString()))
            ->get()->groupBy('professional_profile_id');

        $rows = $employees->map(function ($e) use ($offers, $waitCounts, $pending, $loans, $contracts) {
            $profile  = $e->user?->professionalProfile;
            $name     = $e->user?->name ?: trim("{$e->first_name} {$e->last_name}") ?: 'Salarié';
            $offer    = $profile ? $offers->get($profile->id) : null;
            $inactive = in_array($e->status, ['ended', 'inactive', 'left'], true);
            $lendable = $this->isLendable($e);

            $info = $this->market->resolve($profile ? $loans->get($profile->id) : null);
            $kind = $info['state'] !== 'available' ? 'loan' : null;

            if (!$kind && !$lendable && $profile && $contracts->has($profile->id)) {
                $info          = $this->market->resolve($contracts->get($profile->id));
                $info['state'] = 'on_mission';
                $kind          = 'contract';
            }

            $listing = 'none';
            if ($offer) {
                $listing = $offer->status === 'draft' ? 'draft'
                    : (($offer->end_at && $offer->end_at->lt(today())) ? 'expired' : 'published');
            }

            $m = $info['mission'];

            return [
                'employee_id'    => $e->id,
                'name'           => $name,
                'position'       => $e->position ?: $profile?->headline,
                'email'          => $e->user?->email ?: $e->email,
                'photo_url'      => $e->photo_url,
                'has_account'    => (bool) $profile,
                'profile_id'     => $profile?->id,
                'contract_type'  => $e->contract_type,
                'skills'         => $profile ? $profile->skills->take(6)->pluck('name')->values() : [],
                'lendable'       => $lendable,
                'publishable'    => (bool) $profile && !$inactive && $lendable,
                'inactive'       => $inactive,
                'state'          => $info['state'],
                'available_from' => $info['available_from'],
                'indefinite'     => $info['indefinite'],
                   'reserved_by'    => $kind === 'loan' ? ($m->requestingCompany?->name ?? 'Entreprise externe') : null,
                   'reserved_by_id' => $kind === 'loan' ? $m->requesting_company_id : null,
                'mission'        => $m ? [
                    'id'     => $m->id,
                    'title'  => $m->title,
                    'kind'   => $kind,
                    'client' => $kind === 'loan' ? ($m->requestingCompany?->name ?? 'Entreprise externe') : null,
                    'status' => $m->status,
                    'end_at' => $m->end_at?->toDateString(),
                ] : null,
                'listing'        => $listing,
                'offer'          => $offer ? [
                    'id'           => $offer->id,
                    'title'        => $offer->title,
                    'status'       => $offer->status,
                    'visibility'   => $offer->visibility,
                    'mission_type' => $offer->mission_type,
                    'start_at'     => $offer->start_at?->toDateString(),
                    'end_at'       => $offer->end_at?->toDateString(),
                    'daily_rate'   => $offer->daily_rate,
                    'currency'     => $offer->currency, // ✅ Ajouté ici pour le pool
                ] : null,
                'waitlist_count'    => (int) ($offer ? ($waitCounts[$offer->id] ?? 0) : 0),
                'pending_proposals' => (int) ($offer ? ($pending[$offer->id] ?? 0) : 0),
            ];
        })->values();

        $borrowed = Mission::where('requesting_company_id', $company->id)
            ->whereNotNull('supplying_company_id')
            ->whereIn('status', TalentMarketService::OCCUPYING)
            ->with(['profile.user:id,name', 'supplyingCompany:id,name'])
            ->latest()->get()
            ->map(fn ($m) => [
                'id'       => $m->id,
                'title'    => $m->title,
                'status'   => $m->status,
                'lender'   => $m->supplyingCompany?->name,
                'start_at' => $m->start_at?->toDateString(),
                'end_at'   => $m->end_at?->toDateString(),
                'talent'   => [
                    'name'       => $m->profile?->user?->name,
                    'headline'   => (($h = $m->profile?->headline) && strcasecmp($h, (string) $m->profile?->user?->name) !== 0) ? $h : $m->title,
                    'avatar_url' => $m->profile?->avatar_path ? url('/storage/' . $m->profile->avatar_path) : null,
                ],
            ])->values();

        return response()->json([
            'has_company' => true,
            'company'     => ['id' => $company->id, 'name' => $company->name],
            'employees'   => $rows,
            'borrowed'    => $borrowed,
            'summary'     => [
                'total'      => $rows->count(),
                'listed'     => $rows->where('listing', 'published')->count(),
                'available'  => $rows->where('state', 'available')->where('lendable', true)->where('listing', 'published')->count(),
                'lent'       => $rows->filter(fn ($r) => ($r['mission']['kind'] ?? null) === 'loan')->count(),
                'on_mission' => $rows->whereIn('state', ['on_mission', 'reserved'])->count(),
                'waiting'    => $rows->sum('waitlist_count'),
                'borrowed'   => $borrowed->count(),
            ],
        ]);
    }

    public function suggest(Request $request)
    {
        $request->validate([
            'company_id'     => ['required', 'exists:companies,id'],
            'employee_ids'   => ['required', 'array', 'min:1', 'max:50'],
            'employee_ids.*' => ['integer'],
        ]);

        $user = $request->user();
        $company = $user->ownedCompanies()->find($request->company_id) 
                ?? $user->memberCompanies()->find($request->company_id);
        
        abort_unless($company, 403, 'Cette entreprise ne vous appartient pas.');

        $employees = Employee::where('company_id', $company->id)
            ->whereIn('id', $request->employee_ids)
            ->with('user.professionalProfile.skills')->get();

        $talents = $employees->map(function ($e) {
            $profile = $e->user?->professionalProfile;

            return [
                'employee_id' => $e->id,
                'skills'      => $profile ? $profile->skills->take(12)->pluck('name')->values()->all() : [],
                'skill_ids'   => $profile ? $profile->skills->take(12)->pluck('id')->values()->all() : [],
            ];
        })->values();

        $skillIds = $talents->pluck('skill_ids')->flatten()->unique()->values()->all();

        $ratesQuery = fn () => ResourceOffer::query()->published()
            ->whereIn('visibility', TalentMarketService::VISIBLE)
            ->whereNotNull('daily_rate')->where('daily_rate', '>', 0);

        $rates = $skillIds
            ? $ratesQuery()->whereHas('skills', fn ($s) => $s->whereIn('skills.id', $skillIds))->pluck('daily_rate')
            : collect();
        if ($rates->count() < 3) {
            $rates = $ratesQuery()->pluck('daily_rate');
        }

        $rate = null;
        if ($rates->count() >= 1) {
            $sorted = $rates->sort()->values();
            $mid    = intdiv($sorted->count(), 2);
            $median = $sorted->count() % 2 ? $sorted[$mid] : (int) round(($sorted[$mid - 1] + $sorted[$mid]) / 2);
            $rate   = ['median' => (int) $median, 'min' => (int) $sorted->first(), 'max' => (int) $sorted->last(), 'count' => $sorted->count()];
        }

        return response()->json([
            'company_city' => $company->city,
            'rate'         => $rate,
            'talents'      => $talents->map(fn ($t) => ['employee_id' => $t['employee_id'], 'skills' => $t['skills']])->values(),
        ]);
    }

    public function publish(Request $request, NotificationService $notifications)
    {
        $data = $request->validate([
            'company_id'      => ['required', 'exists:companies,id'],
            'employee_ids'    => ['required', 'array', 'min:1', 'max:50'],
            'employee_ids.*'  => ['integer'],
            'mission_type'    => ['required', 'in:full_time,part_time,freelance,mission,loan'],
            'start_at'        => ['required', 'date'],
            'end_at'          => ['required', 'date', 'after_or_equal:start_at'],
            'workload_unit'   => ['nullable', 'in:percentage,hours_per_week,days_per_week'],
            'workload_value'  => ['nullable', 'integer', 'min:1', 'max:100'],
            'location_type'   => ['required', 'in:onsite,remote,hybrid'],
            'location_city'   => ['nullable', 'string', 'max:100'],
            'country'         => ['nullable', 'string', 'max:100'],
            'city'            => ['nullable', 'string', 'max:100'],
            'visibility'      => ['required', 'in:public,private'],
            'status'          => ['required', 'in:draft,published'],
            'title_template'  => ['nullable', 'string', 'max:180'],
            'description'     => ['nullable', 'string'],
            'conditions'      => ['nullable', 'string', 'max:2000'],
            'daily_rate'      => ['nullable', 'integer', 'min:0'],
            'currency'        => ['nullable', 'string', 'in:EUR,MGA'], // ✅ Ajout de la validation
            'hourly_rate'     => ['nullable', 'integer', 'min:0'],
            'overrides'               => ['nullable', 'array'],
            'overrides.*.employee_id' => ['required_with:overrides', 'integer'],
            'overrides.*.title'       => ['nullable', 'string', 'max:150'],
            'overrides.*.description' => ['nullable', 'string', 'max:5000'],
            'overrides.*.skills'         => ['nullable', 'array', 'max:30'],
            'overrides.*.skills.*.name'  => ['required_with:overrides.*.skills', 'string', 'max:100'],
            'overrides.*.skills.*.level' => ['nullable', 'in:beginner,intermediate,advanced,expert'],
        ]);

        $user = $request->user();
        $company = $user->ownedCompanies()->find($data['company_id']) 
                ?? $user->memberCompanies()->find($data['company_id']);
                
        if (!$company) {
            return response()->json(['message' => 'Cette entreprise ne vous appartient pas.'], 403);
        }

        $dbMissionType = match ($data['mission_type']) {
            'loan'      => 'staffing',
            'full_time' => 'staffing',
            'part_time' => 'freelance',
            'freelance' => 'freelance',
            'mission'   => 'mission',
            default     => 'other',
        };

        $validUnits = ['percentage', 'hours_per_week', 'days_per_week'];
        $unit = in_array($data['workload_unit'] ?? '', $validUnits) ? $data['workload_unit'] : 'percentage';
        
        $value = $data['workload_value'] ?? 100;

        $employees = Employee::where('company_id', $company->id)
            ->whereIn('id', $data['employee_ids'])
            ->with('user.professionalProfile.skills')->get();

        $created = 0; $updated = 0; $skipped = []; $offerIds = []; $first = null;
        $levels = ['beginner', 'intermediate', 'advanced', 'expert'];

        foreach ($data['employee_ids'] as $eid) {
            $emp = $employees->firstWhere('id', $eid);
            if (!$emp) { $skipped[] = ['employee_id' => $eid, 'name' => '—', 'reason' => 'Salarié introuvable dans cette entreprise.']; continue; }

            $profile = $emp->user?->professionalProfile;
            $name    = $emp->user?->name ?: trim("{$emp->first_name} {$emp->last_name}") ?: 'Salarié';
            if (!$profile) { $skipped[] = ['employee_id' => $eid, 'name' => $name, 'reason' => "Ce salarié n'a pas de compte TalentShare : invitez-le d'abord."]; continue; }
            if (in_array($emp->status, ['ended', 'inactive', 'left'], true)) { $skipped[] = ['employee_id' => $eid, 'name' => $name, 'reason' => 'Salarié inactif.']; continue; }
            if (!$this->isLendable($emp)) { 
                $skipped[] = ['employee_id' => $eid, 'name' => $name, 'reason' => "Seuls les salariés en CDI peuvent être mis sur le marché."]; 
                continue; 
            }

            $position = $emp->position ?: $profile->headline ?: 'Collaborateur';
            
            $ov = collect($data['overrides'] ?? [])->firstWhere('employee_id', $eid) ?? [];
            
            $title = !empty($ov['title'])
                ? $ov['title']
                : (!empty($data['title_template'])
                    ? str_replace(['{poste}', '{nom}'], [$position, $name], $data['title_template'])
                    : "{$position} disponible");

            $payload = [
                'company_id'              => $company->id,
                'professional_profile_id' => $profile->id,
                'title'                   => Str::limit($title, 150, ''),
                'description'             => !empty($ov['description'])
                    ? $ov['description']
                    : ($data['description'] ?? "{$name} est disponible pour une mission au sein d'une autre entreprise."),
                'mission_type'            => $dbMissionType,
                'start_at'                => $data['start_at'],
                'end_at'                  => $data['end_at'],
                'workload_unit'           => $unit,
                'workload_value'          => $value,
                'workload_percent'        => $unit === 'percentage' ? $value : 100,
                'location_type'           => $data['location_type'],
                'remote'                  => in_array($data['location_type'], ['remote', 'hybrid']),
                'location_city'           => $data['location_city'] ?? null,
                'country'                 => $data['country'] ?? 'Madagascar',
                'city'                    => $data['city'] ?? null,
                'visibility'              => $data['visibility'],
                'status'                  => $data['status'],
                'conditions'              => $data['conditions'] ?? null,
                'daily_rate'              => $data['daily_rate'] ?? null,
                'currency'                => $data['currency'] ?? 'EUR', // ✅ Sauvegarde de la devise
                'hourly_rate'             => $data['hourly_rate'] ?? null,
            ];

            $offer = ResourceOffer::where('company_id', $company->id)
                ->where('professional_profile_id', $profile->id)
                ->whereIn('status', ['draft', 'published', 'closed'])
                ->latest('id')->first();

            if ($offer) {
                $offer->update($payload);
                $updated++;
            } else {
                $offer = ResourceOffer::create($payload);
                $created++;
            }

            if (!empty($ov['skills'])) {
                $sync = [];
                $defaultCategoryId = \App\Models\SkillCategory::value('id');
                if (!$defaultCategoryId) {
                    $cat = \App\Models\SkillCategory::create(['name' => 'Général', 'slug' => 'general']);
                    $defaultCategoryId = $cat->id;
                }

                foreach ($ov['skills'] as $sk) {
                    $skillName = trim($sk['name']);
                    if (!$skillName) continue;

                    $skill = \App\Models\Skill::whereRaw('lower(name) = ?', [mb_strtolower($skillName)])->first();
                    
                    if (!$skill) {
                        $skill = \App\Models\Skill::create([
                            'name' => $skillName,
                            'slug' => Str::slug($skillName),
                            'skill_category_id' => $defaultCategoryId,
                        ]);
                    }
                    
                    if ($skill) {
                        $sync[$skill->id] = ['level' => $sk['level'] ?? 'intermediate'];
                    }
                }
                if ($sync) { $offer->skills()->sync($sync); }
            } elseif ($offer->skills()->count() === 0) {
                $sync = $profile->skills->take(10)->mapWithKeys(fn ($s) => [
                    $s->id => ['level' => in_array($s->pivot?->level, $levels, true) ? $s->pivot->level : null],
                ])->all();
                if ($sync) { $offer->skills()->sync($sync); }
            }

            $offerIds[] = $offer->id;
            $first ??= $offer;
        }

        if ($first && $data['status'] === 'published' && $data['visibility'] === 'public' && $created > 0) {
            User::where('role', 'company')->where('id', '!=', $request->user()->id)->limit(100)->get()
                ->each(function ($u) use ($notifications, $company, $created, $first) {
                    try {
                        $notifications->notify(
                            $u, 'resource_offer_published', '📢 Nouveaux talents disponibles',
                            "{$company->name} met {$created} talent" . ($created > 1 ? 's' : '') . ' à disposition.',
                            $first, ['url' => '/resource-offers/browse']
                        );
                    } catch (\Throwable $e) { \Log::warning('Notif publish: ' . $e->getMessage()); }
                });
        }

        return response()->json([
            'created' => $created, 'updated' => $updated, 'skipped' => $skipped, 'offer_ids' => $offerIds,
        ], 201);
    }

    public function unpublish(Request $request)
    {
        $data = $request->validate([
            'offer_ids'   => ['required', 'array', 'min:1', 'max:50'],
            'offer_ids.*' => ['integer'],
        ]);

        $myIds  = $this->getAllMyCompanyIds($request);
        $offers = ResourceOffer::whereIn('id', $data['offer_ids'])->whereIn('company_id', $myIds)
            ->with(['company', 'profile.user'])->get();

        foreach ($offers as $offer) {
            $offer->update(['status' => 'draft']);

            ResourceOfferWaitlist::where('resource_offer_id', $offer->id)
                ->whereIn('status', ResourceOfferWaitlist::ACTIVE)
                ->with(['company.owner', 'user'])->get()
                ->each(function ($entry) use ($offer) {
                    $entry->update(['status' => 'cancelled']);
                    $this->market->notifyEntry(
                        $entry, 'talent_unavailable', 'Talent retiré du marché',
                        ($offer->profile?->user?->name ?? 'Le talent') . " n'est plus proposé par " . ($offer->company?->name ?? 'son entreprise') . '.',
                        $offer, ['url' => '/resource-offers/browse']
                    );
                });
        }

        return response()->json(['updated' => $offers->count()]);
    }

    private function isLendable(Employee $e): bool
    {
        return self::LENDABLE_CONTRACTS === null
            || in_array($e->contract_type ?: 'permanent', self::LENDABLE_CONTRACTS, true);
    }

    private function applyFilters($q, Request $r): void
    {
        $q->when($r->filled('search'), function ($q) use ($r) {
            $s = $r->search;
            $q->where(function ($sq) use ($s) {
                $sq->where('title', 'ilike', "%{$s}%")
                   ->orWhere('description', 'ilike', "%{$s}%")
                   ->orWhereHas('profile', fn ($p) => $p->where('headline', 'ilike', "%{$s}%"))
                   ->orWhereHas('profile.user', fn ($u) => $u->where('name', 'ilike', "%{$s}%"))
                   ->orWhereHas('company', fn ($c) => $c->where('name', 'ilike', "%{$s}%"))
                   ->orWhereHas('skills', fn ($k) => $k->where('skills.name', 'ilike', "%{$s}%"));
            });
        });

        $q->when($r->filled('mission_type'), fn ($q) => $q->where('mission_type', $r->mission_type))
          ->when($r->filled('location_type'), fn ($q) => $q->where('location_type', $r->location_type))
          ->when($r->filled('company_id'), fn ($q) => $q->where('company_id', $r->company_id))
          ->when($r->filled('skill_id'), fn ($q) => $q->whereHas('skills', fn ($s) => $s->where('skills.id', $r->skill_id)))
          ->when($r->filled('max_daily_rate'), fn ($q) => $q->where('daily_rate', '<=', $r->max_daily_rate))
          ->when($r->filled('city'), fn ($q) => $q->where(fn ($c) =>
              $c->where('location_city', 'ilike', "%{$r->city}%")->orWhere('city', 'ilike', "%{$r->city}%")));
    }

    private function position(ResourceOfferWaitlist $e): int
    {
        return ResourceOfferWaitlist::where('resource_offer_id', $e->resource_offer_id)
            ->whereIn('status', ResourceOfferWaitlist::ACTIVE)
            ->where('created_at', '<=', $e->created_at)->count();
    }

    private function waitingCompanies(ResourceOffer $offer): array
    {
        return ResourceOfferWaitlist::where('resource_offer_id', $offer->id)
            ->whereIn('status', ResourceOfferWaitlist::ACTIVE)
            ->with('company:id,name,logo_path')->oldest()->get()->values()
            ->map(fn ($e, $i) => [
                'company_id'       => (int) $e->company_id,
                'company'          => ['id' => $e->company_id, 'name' => $e->company?->name, 'logo_url' => $e->company?->logo_url],
                'position'         => $i + 1,
                'status'           => $e->status,
                'message'          => $e->message,
                'desired_start_at' => $e->desired_start_at?->toDateString(),
            ])->all();
    }

    private function context($offers, array $myIds): array
    {
        $offerIds   = $offers->pluck('id')->all();
        $profileIds = $offers->pluck('professional_profile_id')->unique()->values()->all();

        return [
            'missions'   => $this->market->missionsByProfile($profileIds),
            'waitCounts' => ResourceOfferWaitlist::whereIn('resource_offer_id', $offerIds)->whereIn('status', ResourceOfferWaitlist::ACTIVE)
                ->selectRaw('resource_offer_id, count(*) as c')->groupBy('resource_offer_id')->pluck('c', 'resource_offer_id'),
            'mine'       => $myIds
                ? ResourceOfferWaitlist::whereIn('resource_offer_id', $offerIds)->whereIn('company_id', $myIds)
                    ->whereIn('status', ResourceOfferWaitlist::ACTIVE)->get()->groupBy('resource_offer_id')
                : collect(),
            'proposed'   => $myIds
                ? Proposal::whereIn('resource_offer_id', $offerIds)->whereIn('proposed_by_company_id', $myIds)
                    ->whereNotIn('status', ['cancelled', 'declined', 'expired'])
                    ->get(['resource_offer_id', 'proposed_by_company_id'])->groupBy('resource_offer_id')
                : collect(),
        ];
    }

    private function present(ResourceOffer $o, array $ctx, bool $detail = false): array
    {
        $info    = $this->market->resolve($ctx['missions']->get($o->professional_profile_id));
        $profile = $o->profile;
        $user    = $profile?->user;

        $item = [
            'id'             => $o->id,
            'title'          => $o->title,
            'excerpt'        => Str::limit((string) $o->description, 200),
            'mission_type'   => $o->mission_type,
            'start_at'       => $o->start_at?->toDateString(),
            'end_at'         => $o->end_at?->toDateString(),
            'workload_unit'  => $o->workload_unit,
            'workload_value' => $o->workload_value,
            'location_type'  => $o->location_type,
            'location_city'  => $o->location_city ?: $o->city,
            'country'        => $o->country,
            'daily_rate'     => $o->daily_rate,
            'currency'       => $o->currency, // ✅ Ajout de la devise
            'hourly_rate'    => $o->hourly_rate,
            'company'        => [
                'id'          => $o->company?->id,
                'name'        => $o->company?->name,
                'logo_url'    => $o->company?->logo_url,
                'city'        => $o->company?->city,
                'is_verified' => (bool) $o->company?->is_verified,
            ],
            'talent'         => [
                'profile_id' => $profile?->id,
                'name'       => $user?->name,
                'headline'   => ($profile?->headline && strcasecmp($profile->headline, $user->name) !== 0) ? $profile->headline : null,
                'avatar_url' => $profile?->avatar_path ? url('/storage/' . $profile->avatar_path) : null,
                'portfolio'  => null, // rempli uniquement dans le détail
            ],
            'skills'         => $o->skills->map(fn ($s) => ['id' => $s->id, 'name' => $s->name, 'level' => $s->pivot?->level])->values(),
            'state'          => $info['state'],
            'available_from' => $info['available_from'],
            'indefinite'     => $info['indefinite'],
            
            'waitlist_count' => (int) ($ctx['waitCounts'][$o->id] ?? 0),
            'waiting_company_ids'  => $ctx['mine']->get($o->id, collect())->pluck('company_id')->map(fn ($v) => (int) $v)->values()->all(),
            'proposed_company_ids' => $ctx['proposed']->get($o->id, collect())->pluck('proposed_by_company_id')->map(fn ($v) => (int) $v)->unique()->values()->all(),
        ];

        if ($detail) {
            $item['description'] = $o->description;
            $item['conditions']  = $o->conditions;
            $item['bio']         = $profile?->bio;

            $pf = $profile?->portfolio;
            if ($pf && $pf->public_slug && in_array($pf->visibility, ['public'], true)) {
                $item['talent']['portfolio'] = [
                    'id'    => $pf->id,
                    'slug'  => $pf->public_slug,
                    'title' => $pf->title,
                ];
            }
        }

        return $item;
    }
}