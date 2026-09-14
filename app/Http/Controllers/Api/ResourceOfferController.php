<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResourceOffer;
use App\Models\Company;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class ResourceOfferController extends Controller
{
    /**
     * Liste publique des offres (recherche)
     * ✅ Exclut les offres de MES entreprises
     */
    public function index(Request $request)
    {
        $user = auth('sanctum')->user();
        $myCompanyIds = $user ? $user->companies()->pluck('id')->toArray() : [];

        return ResourceOffer::query()
            ->published()
            ->public()
            ->when(!empty($myCompanyIds), fn ($q) =>
                $q->whereNotIn('company_id', $myCompanyIds)
            )
            ->with([
                'company:id,name,logo_path,city,country,owner_user_id',
                'profile.user:id,name,first_name,last_name',
                'profile.skills.category.parent',
                'profile.skills.category',
                'skills',
            ])
            ->when($request->search, function ($q, $s) {
                $q->where(function ($sq) use ($s) {
                    $sq->where('title', 'ilike', "%{$s}%")
                       ->orWhere('description', 'ilike', "%{$s}%")
                       ->orWhereHas('profile', fn ($pq) => $pq->where('headline', 'ilike', "%{$s}%"))
                       ->orWhereHas('profile.user', fn ($uq) => $uq->where('name', 'ilike', "%{$s}%"));
                });
            })
            ->when($request->skill_id, fn ($q, $id) =>
                $q->whereHas('skills', fn ($sq) => $sq->where('skills.id', $id))
            )
            ->when($request->mission_type, fn ($q, $v) => $q->where('mission_type', $v))
            ->when($request->location_type, fn ($q, $v) => $q->where('location_type', $v))
            ->when($request->country, fn ($q, $v) => $q->where('country', $v))
            ->when($request->city, fn ($q, $v) => $q->where('city', 'ilike', "%{$v}%"))
            ->when($request->max_daily_rate, fn ($q, $v) => $q->where('daily_rate', '<=', $v))
            ->when($request->start_at && $request->end_at, function ($q) use ($request) {
                $q->where('start_at', '<=', $request->end_at)
                  ->where('end_at', '>=', $request->start_at);
            })
            ->latest()
            ->paginate($request->get('per_page', 15));
    }

    /**
     * Mes offres (entreprise connectée)
     */
   public function my(Request $request)
{
    $companyIds = $request->user()->companies()->pluck('id');

    return ResourceOffer::whereIn('company_id', $companyIds)
        ->with([
            'profile.user:id,name',
            'skills',
            'activeMission.requestingCompany:id,name',
        ])
        ->latest()
        ->get()
        ->map(function ($offer) {
            $offer->append(['display_status']);
            return $offer;
        });
}

    /**
     * Détail d'une offre (avec notification "vue")
     */
    public function show(Request $request, ResourceOffer $resourceOffer, NotificationService $notifications)
    {
        $user = auth('sanctum')->user();

        // ✅ Notifier le propriétaire si ce n'est pas lui qui regarde
        if ($user && $user->id !== $resourceOffer->company->owner_user_id) {
            $alreadyNotified = \App\Models\Notification::where('user_id', $resourceOffer->company->owner_user_id)
                ->where('type', 'offer_viewed')
                ->where('subject_id', $resourceOffer->id)
                ->where('created_at', '>=', now()->subMinutes(30))
                ->exists();

            if (!$alreadyNotified) {
                $notifications->notify(
                    $resourceOffer->company->owner,
                    'offer_viewed',
                    '👀 Votre offre a été consultée',
                    "{$user->name} a consulté votre offre \"{$resourceOffer->title}\".",
                    $resourceOffer,
                    ['offer_id' => $resourceOffer->id]
                );
            }
        }

        return $resourceOffer->load([
            'company',
            'profile.user',
            'profile.skills.category.parent',
            'profile.skills.category',
            'skills',
        ]);
    }

    /**
     * Créer une offre + broadcaster à toutes les entreprises
     */
    public function store(Request $request, NotificationService $notifications)
    {
        $data = $request->validate([
            'company_id'              => ['required', 'exists:companies,id'],
            'professional_profile_id' => ['required', 'exists:professional_profiles,id'],
            'title'                   => ['required', 'string', 'max:180'],
            'description'             => ['nullable', 'string'],
            'mission_type'            => ['required', 'in:full_time,part_time,freelance,mission,loan'],
            'start_at'                => ['required', 'date'],
            'end_at'                  => ['required', 'date', 'after_or_equal:start_at'],
            'workload_unit'           => ['required', 'in:percentage,hours_per_week,days_per_week'],
            'workload_value'          => ['required', 'integer', 'min:0', 'max:100'],
            'location_type'           => ['required', 'in:onsite,remote,hybrid'],
            'location_city'           => ['nullable', 'string', 'max:100'],
            'country'                 => ['nullable', 'string', 'max:100'],
            'city'                    => ['nullable', 'string', 'max:100'],
            'visibility'              => ['required', 'in:public,network,private'],
            'status'                  => ['required', 'in:draft,published,closed'],
            'conditions'              => ['nullable', 'string', 'max:2000'],
            'daily_rate'              => ['nullable', 'integer', 'min:0'],
            'hourly_rate'             => ['nullable', 'integer', 'min:0'],
            'skills'                  => ['nullable', 'array'],
            'skills.*.skill_id'       => ['required', 'exists:skills,id'],
            'skills.*.level'          => ['nullable', 'in:beginner,intermediate,advanced,expert'],
        ]);

        if ($request->user()->companies()->where('id', $data['company_id'])->doesntExist()) {
            return response()->json(['message' => 'Cette entreprise ne vous appartient pas.'], 403);
        }

        $employee = \App\Models\Employee::where('company_id', $data['company_id'])
            ->whereHas('user.professionalProfile', fn ($q) =>
                $q->where('id', $data['professional_profile_id'])
            )
            ->exists();

        if (!$employee) {
            return response()->json(['message' => 'Ce salarié n\'appartient pas à cette entreprise.'], 403);
        }

        $skills = $data['skills'] ?? [];
        unset($data['skills']);

        $data['workload_percent'] = $data['workload_unit'] === 'percentage'
            ? $data['workload_value']
            : 100;
        $data['remote'] = in_array($data['location_type'], ['remote', 'hybrid']);

        $offer = ResourceOffer::create($data);

        if ($skills) {
            $offer->skills()->sync(
                collect($skills)->mapWithKeys(fn ($s) => [
                    $s['skill_id'] => ['level' => $s['level'] ?? null]
                ])
            );
        }

        // ✅ Broadcaster aux autres entreprises si publiée + publique
        if ($offer->status === 'published' && $offer->visibility === 'public') {
            $notifications->notifyAllExcept(
                $request->user(),
                'resource_offer_published',
                '📢 Nouvelle offre disponible',
                "{$offer->company->name} propose un nouveau salarié : {$offer->title}",
                $offer,
                ['offer_id' => $offer->id]
            );
        }

        return response()->json($offer->load('skills', 'profile.user'), 201);
    }

    /**
     * Modifier une offre
     */
    public function update(Request $request, ResourceOffer $resourceOffer)
    {
        $companyIds = $request->user()->companies()->pluck('id');
        abort_unless($companyIds->contains($resourceOffer->company_id), 403, 'Non autorisé.');

        $data = $request->validate([
            'title'         => ['sometimes', 'string', 'max:180'],
            'description'   => ['nullable', 'string'],
            'mission_type'  => ['sometimes', 'in:full_time,part_time,freelance,mission,loan'],
            'start_at'      => ['sometimes', 'date'],
            'end_at'        => ['sometimes', 'date', 'after_or_equal:start_at'],
            'workload_unit' => ['sometimes', 'in:percentage,hours_per_week,days_per_week'],
            'workload_value'=> ['sometimes', 'integer', 'min:0', 'max:100'],
            'location_type' => ['sometimes', 'in:onsite,remote,hybrid'],
            'location_city' => ['nullable', 'string', 'max:100'],
            'visibility'    => ['sometimes', 'in:public,network,private'],
            'status'        => ['sometimes', 'in:draft,published,closed'],
            'conditions'    => ['nullable', 'string', 'max:2000'],
            'daily_rate'    => ['nullable', 'integer', 'min:0'],
            'hourly_rate'   => ['nullable', 'integer', 'min:0'],
            'skills'        => ['nullable', 'array'],
            'skills.*.skill_id' => ['required', 'exists:skills,id'],
            'skills.*.level'    => ['nullable', 'in:beginner,intermediate,advanced,expert'],
        ]);

        $skills = $data['skills'] ?? null;
        unset($data['skills']);

        if (isset($data['location_type'])) {
            $data['remote'] = in_array($data['location_type'], ['remote', 'hybrid']);
        }

        $resourceOffer->update($data);

        if ($skills !== null) {
            $resourceOffer->skills()->sync(
                collect($skills)->mapWithKeys(fn ($s) => [
                    $s['skill_id'] => ['level' => $s['level'] ?? null]
                ])
            );
        }

        return $resourceOffer->load('skills', 'profile.user');
    }

    /**
     * Supprimer une offre
     */
    public function destroy(Request $request, ResourceOffer $resourceOffer)
    {
        $companyIds = $request->user()->companies()->pluck('id');
        abort_unless($companyIds->contains($resourceOffer->company_id), 403, 'Non autorisé.');

        $resourceOffer->delete();

        return response()->json(['message' => 'Offre supprimée.']);
    }
}