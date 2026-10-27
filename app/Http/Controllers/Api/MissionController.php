<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mission;
use App\Models\ResourceOffer;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MissionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $companyIds = $user->companies()->pluck('id');

        return Mission::query()
            ->where(function ($q) use ($companyIds, $user) {
                $q->whereIn('requesting_company_id', $companyIds)
                  ->orWhereIn('supplying_company_id', $companyIds);

                if ($user->professionalProfile) {
                    $q->orWhere('professional_profile_id', $user->professionalProfile->id);
                }
            })
            ->with([
                'requestingCompany:id,name,owner_user_id',
                'supplyingCompany:id,name,owner_user_id',
                'profile.user:id,name,first_name,last_name',
                'resourceOffer:id,title',
                'proposal.resourceRequest:id,title',
            ])
            ->latest()
            ->get();
    }

    public function show(Mission $mission)
    {
        return $mission->load([
            'requestingCompany',
            'supplyingCompany',
            'profile.user',
            'proposal.resourceRequest',
            'resourceOffer',
        ]);
    }

    public function store(Request $request, NotificationService $notifications)
    {
        $data = $request->validate([
            'resource_offer_id'     => ['required', 'exists:resource_offers,id'],
            'requesting_company_id' => ['nullable', 'exists:companies,id'],
            'start_at'              => ['required', 'date'],
            'end_at'                => ['required', 'date', 'after_or_equal:start_at'],
            'workload_value'        => ['required', 'integer', 'min:0', 'max:100'],
            'workload_unit'         => ['required', 'in:percentage,hours_per_week,days_per_week'],
            'daily_rate'            => ['nullable', 'integer', 'min:0'],
            'notes'                 => ['nullable', 'string', 'max:2000'],
        ]);

        $offer = ResourceOffer::with(['company.owner', 'profile.user'])->findOrFail($data['resource_offer_id']);
        $user = $request->user();

        $isOwner = $user->companies()->where('id', $offer->company_id)->exists();
        if (!$isOwner) {
            return response()->json(['message' => 'Seule l\'entreprise prêteuse peut créer la mission.'], 403);
        }

        $existing = Mission::where('resource_offer_id', $offer->id)
            ->whereIn('status', ['pending_employee', 'planned', 'active'])
            ->exists();

        if ($existing) {
            return response()->json(['message' => 'Une mission est déjà en cours pour cette offre.'], 409);
        }

        if ($offer->status !== 'published') {
            return response()->json(['message' => 'Cette offre n\'est plus disponible.'], 409);
        }

        $mission = Mission::create([
            'resource_offer_id'       => $offer->id,
            'professional_profile_id' => $offer->professional_profile_id,
            'supplying_company_id'    => $offer->company_id,
            'requesting_company_id'   => $data['requesting_company_id'] ?? null,
            'start_at'                => $data['start_at'],
            'end_at'                  => $data['end_at'],
            'workload_percent'        => $data['workload_unit'] === 'percentage' ? $data['workload_value'] : 100,
            'remote'                  => in_array($offer->location_type, ['remote', 'hybrid']),
            'status'                  => 'pending_employee',
        ]);

        if ($offer->profile->user) {
            $notifications->notify(
                $offer->profile->user,
                'mission_pending_approval',
                '🎯 Nouvelle mission proposée',
                "L'entreprise {$offer->company->name} souhaite vous prêter du " .
                \Carbon\Carbon::parse($data['start_at'])->format('d/m/Y') . " au " .
                \Carbon\Carbon::parse($data['end_at'])->format('d/m/Y') .
                ". En attente de votre accord.",
                $mission
            );
        }

        if (!empty($data['requesting_company_id'])) {
            $requestingCompany = \App\Models\Company::with('owner')->find($data['requesting_company_id']);
            if ($requestingCompany?->owner) {
                $notifications->notify(
                    $requestingCompany->owner,
                    'mission_created_pending',
                    '⏳ Mission en attente d\'approbation',
                    "En attente d'accord du salarié pour la mission du " .
                    \Carbon\Carbon::parse($data['start_at'])->format('d/m/Y') . ".",
                    $mission
                );
            }
        }

        return response()->json($mission->load(['profile.user', 'supplyingCompany']), 201);
    }

    public function accept(Request $request, Mission $mission, NotificationService $notifications)
    {
        $user = $request->user();

        if (!$user->professionalProfile || $user->professionalProfile->id !== $mission->professional_profile_id) {
            return response()->json(['message' => 'Seul le salarié concerné peut accepter cette mission.'], 403);
        }

        if ($mission->status !== 'pending_employee') {
            return response()->json(['message' => 'Cette mission ne peut plus être acceptée.'], 409);
        }

        $mission->update(['status' => 'planned']);
        $mission->resourceOffer?->update(['status' => 'closed']);

        if ($mission->supplyingCompany?->owner) {
            $notifications->notify(
                $mission->supplyingCompany->owner,
                'mission_accepted',
                '✅ Mission acceptée',
                "{$user->name} a accepté la mission du " .
                $mission->start_at->format('d/m/Y') . " au " .
                $mission->end_at->format('d/m/Y') . ".",
                $mission
            );
        }

        if ($mission->requestingCompany?->owner) {
            $notifications->notify(
                $mission->requestingCompany->owner,
                'mission_accepted',
                '✅ Mission acceptée',
                "Le salarié a accepté la mission. Elle peut démarrer.",
                $mission
            );
        }

        return response()->json($mission);
    }

    public function decline(Request $request, Mission $mission, NotificationService $notifications)
    {
        $user = $request->user();

        if (!$user->professionalProfile || $user->professionalProfile->id !== $mission->professional_profile_id) {
            return response()->json(['message' => 'Seul le salarié concerné peut refuser cette mission.'], 403);
        }

        if ($mission->status !== 'pending_employee') {
            return response()->json(['message' => 'Cette mission ne peut plus être refusée.'], 409);
        }

        $mission->update(['status' => 'cancelled']);

        if ($mission->supplyingCompany?->owner) {
            $notifications->notify(
                $mission->supplyingCompany->owner,
                'mission_declined',
                '❌ Mission refusée',
                "{$user->name} a refusé la mission. L'offre est de nouveau disponible.",
                $mission
            );
        }

        return response()->json($mission);
    }

    public function updateStatus(Request $request, Mission $mission)
    {
        $request->validate(['status' => 'required|string|in:active,completed,cancelled']);
        $user = $request->user();
        $companyIds = $user->companies()->pluck('id')->toArray();

        $isSupplying = in_array($mission->supplying_company_id, $companyIds);
        $isRequesting = in_array($mission->requesting_company_id, $companyIds);
        $isEmployee = $user->professionalProfile && $user->professionalProfile->id === $mission->professional_profile_id;

        $isDirectHire = empty($mission->supplying_company_id);

        if ($request->status === 'active') {
            if ($isDirectHire) {
                abort_unless($isRequesting, 403, 'Seul le recruteur peut démarrer la mission.');
            } else {
                abort_unless($isSupplying, 403, 'Seule l\'entreprise prêteuse peut démarrer la mission.');
            }
        }

        $mission->update(['status' => $request->status]);

        return response()->json([
            'message' => 'Statut mis à jour',
            'mission' => $mission->fresh(['requestingCompany', 'supplyingCompany', 'profile.user', 'resourceOffer', 'proposal.resourceRequest'])
        ]);
    }

    // ============================================================
    // ✅ EMPLOI : fin de la période d'essai
    // ============================================================

    /** Le recruteur confirme le talent → CDI (sans date de fin) + il devient SALARIÉ de l'entreprise */
    public function validateTrial(Request $request, Mission $mission, NotificationService $notifications)
    {
        $this->authorizeRequestingCompany($request, $mission, 'valider la période d\'essai');

        if ($mission->status !== 'trial') {
            return response()->json(['message' => 'Cette mission n\'est pas en période d\'essai.'], 409);
        }

        DB::transaction(function () use ($mission) {
            $mission->update([
                'status'   => 'active',
                'end_at'   => null,   // CDI : pas de date de fin
                'is_trial' => false,
            ]);

            $this->makeEmployee($mission);
        });

        try {
            $companyName = $mission->requestingCompany?->name ?? "l'entreprise";
            $notifications->notify(
                $mission->profile->user,
                'mission_accepted',
                '🎉 Période d\'essai validée !',
                "Félicitations, vous êtes maintenant salarié chez {$companyName} en CDI.",
                $mission,
                ['url' => "/missions/{$mission->id}", 'mission_id' => $mission->id]
            );
        } catch (\Exception $e) {
            \Log::warning('Notification failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Période d\'essai validée : le talent est maintenant salarié en CDI.',
            'mission' => $mission->fresh(['requestingCompany', 'profile.user', 'proposal.resourceRequest']),
        ]);
    }

    /** Le recruteur ne confirme pas le talent → fin de la collaboration */
    public function rejectTrial(Request $request, Mission $mission, NotificationService $notifications)
    {
        $this->authorizeRequestingCompany($request, $mission, 'mettre fin à la période d\'essai');

        if ($mission->status !== 'trial') {
            return response()->json(['message' => 'Cette mission n\'est pas en période d\'essai.'], 409);
        }

        $mission->update([
            'status'   => 'cancelled',
            'is_trial' => false,
        ]);

        try {
            $companyName = $mission->requestingCompany?->name ?? "L'entreprise";
            $notifications->notify(
                $mission->profile->user,
                'mission_declined',
                'Période d\'essai non confirmée',
                "{$companyName} n'a pas confirmé votre embauche à l'issue de la période d'essai.",
                $mission,
                ['url' => "/missions/{$mission->id}", 'mission_id' => $mission->id]
            );
        } catch (\Exception $e) {
            \Log::warning('Notification failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'La période d\'essai n\'a pas été confirmée.',
            'mission' => $mission->fresh(),
        ]);
    }

    // ============================================================
    // HELPERS
    // ============================================================

    private function authorizeRequestingCompany(Request $request, Mission $mission, string $action): void
    {
        $companyIds = $request->user()->companies()->pluck('id')->toArray();

        abort_unless(
            in_array($mission->requesting_company_id, $companyIds),
            403,
            "Seul le recruteur peut {$action}."
        );
    }

    /** Ajoute le talent aux salariés (+ membres) de l'entreprise, comme CompanyController@addEmployee */
    private function makeEmployee(Mission $mission): void
    {
        $company = $mission->requestingCompany;
        $talent  = $mission->profile?->user;

        if (!$company || !$talent) {
            return;
        }

        $position = $mission->profile?->headline
            ?? $mission->proposal?->resourceRequest?->title
            ?? 'Salarié';

        $company->employees()->firstOrCreate(
            ['user_id' => $talent->id],
            [
                'position'    => $position,
                'status'      => 'active',
                'email'       => $talent->email,
                'first_name'  => $talent->first_name ?: $talent->name,
                'last_name'   => $talent->last_name ?: '',
                'has_account' => true,
            ]
        );

        $company->members()->firstOrCreate(
            ['user_id' => $talent->id],
            ['role' => 'member', 'status' => 'active']
        );
    }
}