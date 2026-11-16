<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mission;
use App\Models\ResourceOffer;
use App\Models\ResourceOfferWaitlist;
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
                'requestingCompany:id,name,owner_user_id,logo_path',
                'supplyingCompany:id,name,owner_user_id,logo_path',
                'profile.user:id,name,first_name,last_name,avatar_path',
                'profile.user.employee', 
                'resourceOffer:id,title',
                'jobOffer:id,title,offer_type,duration_months',
                'proposal' => function ($query) {
                    $query->select('id', 'resource_request_id', 'resource_offer_id')
                          ->with(['resourceRequest:id,title', 'resourceOffer:id,title']);
                },
            ])
            ->latest()
            ->get()
            ->map(function($mission) {
                $requestId = $mission->proposal?->resource_request_id;
                if ($requestId) {
                    $mission->collaborators = Mission::whereHas('proposal', function ($q) use ($requestId) {
                        $q->where('resource_request_id', $requestId);
                    })
                    ->whereIn('status', ['pending_employee', 'planned', 'active', 'trial'])
                    ->with(['profile.user', 'profile', 'profile.user.employee']) 
                    ->get()
                    ->map(fn($m) => [
                        'id' => $m->id,
                        'name' => $m->profile?->user?->name ?? "Talent",
                        'avatar_path' => 
                            $m->profile?->user?->avatar_path 
                            ?? $m->profile?->avatar_path 
                            ?? null,
                        'status' => $m->status,
                    ]);
                } else {
                    $mission->collaborators = [];
                }
                return $mission;
            });
    }

    public function show(Request $request, Mission $mission)
    {
        $this->authorizeMissionAccess($request, $mission);

        $requestId = $mission->proposal?->resource_request_id;

        $collaborators = [];
        if ($requestId) {
            $collaborators = Mission::whereHas('proposal', function ($q) use ($requestId) {
                $q->where('resource_request_id', $requestId);
            })
            ->whereIn('status', ['pending_employee', 'planned', 'active', 'trial'])
            ->with(['profile.user','profile.user.employee', 'profile'])
            ->get()
            ->map(function ($m) {
                return [
                    'id' => $m->id,
                    'name' => $m->profile?->user?->name ?? "Talent",
                    'avatar_path' => 
                        $m->profile?->user?->avatar_path 
                        ?? $m->profile?->avatar_path 
                        ?? null,
                    'status' => $m->status,
                ];
            });
        }

        $data = $mission->load([
            'requestingCompany',
            'supplyingCompany',
            'profile.user',
            'proposal.resourceRequest',
            'resourceOffer',
            'jobOffer',
        ]);

        $data->collaborators = $collaborators;

        return $data;
    }

    private function authorizeMissionAccess(Request $request, Mission $mission): void
    {
        $user = $request->user();
        $companyIds = $user->companies()->pluck('id')->toArray();
        $profileId = $user->professionalProfile?->id;

        $isCollaborator = Mission::whereHas('proposal', function ($q) use ($mission) {
                $requestId = $mission->proposal?->resource_request_id;
                if ($requestId) {
                    $q->where('resource_request_id', $requestId);
                } else {
                    $q->where('id', -1);
                }
            })
            ->where('professional_profile_id', $profileId)
            ->whereIn('status', ['pending_employee', 'planned', 'active', 'trial'])
            ->exists();

        abort_unless(
            $mission->professional_profile_id === $profileId
                || in_array($mission->supplying_company_id, $companyIds)
                || in_array($mission->requesting_company_id, $companyIds)
                || $isCollaborator,
            403,
            'Accès refusé à cette mission.'
        );
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
            'started_at'              => null,
            'end_at'                  => $data['end_at'],
            'workload_percent'        => $data['workload_unit'] === 'percentage' ? $data['workload_value'] : 100,
            'remote'                  => in_array($offer->location_type, ['remote', 'hybrid']),
            'status'                  => 'pending_employee',
            'contract_type'           => 'sharing',
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

        $title = $mission->title
            ?? $mission->resourceOffer?->title
            ?? $mission->proposal?->resourceRequest?->title
            ?? $mission->proposal?->resourceOffer?->title
            ?? "Mission de " . ($user->name ?? 'Talent');

        $mission->update([
            'status' => 'planned',
            'title' => $mission->title ?? $title,
        ]);

        try {
            $notifications->notify(
                $user,
                'mission_accepted',
                '✅ Mission acceptée',
                "Vous avez accepté la mission « {$title} » du " .
                $mission->start_at->format('d/m/Y') . " au " .
                $mission->end_at->format('d/m/Y') . ". Préparez-vous !",
                $mission,
                ['url' => "/missions/{$mission->id}", 'mission_id' => $mission->id]
            );
        } catch (\Exception $e) {
            \Log::warning('Notification failed: ' . $e->getMessage());
        }

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

    public function updateStatus(Request $request, Mission $mission, NotificationService $notifications)
    {
        $request->validate(['status' => 'required|string|in:active,completed,cancelled']);
        $user = $request->user();
        $companyIds = $user->companies()->pluck('id')->toArray();

        $isSupplying  = in_array($mission->supplying_company_id, $companyIds);
        $isRequesting = in_array($mission->requesting_company_id, $companyIds);
        $isEmployee   = $user->professionalProfile && $user->professionalProfile->id === $mission->professional_profile_id;

        $isDirectHire = empty($mission->supplying_company_id);

        if ($request->status === 'active') {
            if ($isDirectHire) {
                abort_unless($isRequesting, 403, 'Seul le recruteur peut démarrer la mission.');
            } else {
                abort_unless($isSupplying, 403, 'Seule l\'entreprise prêteuse peut démarrer la mission.');
            }

            abort_unless(in_array($mission->status, ['planned', 'trial']), 409,
                'Cette mission ne peut pas être démarrée dans son état actuel.');
        }

        $oldStatus = $mission->status;
        $payload = ['status' => $request->status];
        
        $mission->update($payload);

        if ($request->status === 'active' && $oldStatus !== 'active') {
            $mission->update(['started_at' => now()]);
            $this->makeEmployee($mission);
        }

        if ($request->status === 'completed' && $oldStatus !== 'completed') {
            $this->closeEmployee($mission);
        }

        if ($request->status === 'completed' && $oldStatus !== 'completed') {
            $initiatorName = $user->name ?? 'Votre partenaire';
            
            $today = now()->startOfDay();
            $expectedEnd = $mission->end_at ? \Carbon\Carbon::parse($mission->end_at)->startOfDay() : null;
            $isEarlyTermination = $expectedEnd && $today->lt($expectedEnd);

            $completionMessage = $isEarlyTermination 
                ? "La mission « " . ($mission->title ?? 'Mission') . " » a été clôturée avant son terme par {$initiatorName}. Nous sommes désolés pour ce désagrément."
                : "La mission « " . ($mission->title ?? 'Mission') . " » est maintenant terminée. Vous pouvez laisser une évaluation.";

            if ($mission->profile?->user && $mission->profile->user->id !== $user->id) {
                try {
                    $notifications->notify(
                        $mission->profile->user,
                        'mission_completed',
                        $isEarlyTermination ? '⚠️ Mission clôturée de manière anticipée' : '🏁 Mission terminée',
                        $completionMessage,
                        $mission,
                        ['url' => "/missions/{$mission->id}", 'mission_id' => $mission->id]
                    );
                } catch (\Exception $e) { \Log::warning('Notif failed: ' . $e->getMessage()); }
            }

            if ($mission->requestingCompany?->owner && $mission->requestingCompany->owner_user_id !== $user->id) {
                try {
                    $notifications->notify(
                        $mission->requestingCompany->owner,
                        'mission_completed',
                        $isEarlyTermination ? '⚠️ Mission clôturée de manière anticipée' : '🏁 Mission terminée',
                        $isEarlyTermination 
                            ? "La mission « " . ($mission->title ?? 'Mission') . " » a été clôturée avant son terme par {$initiatorName}. Pensez à évaluer le talent."
                            : "La mission « " . ($mission->title ?? 'Mission') . " » est terminée. Pensez à évaluer le talent.",
                        $mission,
                        ['url' => "/missions/{$mission->id}", 'mission_id' => $mission->id]
                    );
                } catch (\Exception $e) { \Log::warning('Notif failed: ' . $e->getMessage()); }
            }

            if ($mission->supplyingCompany?->owner
                && $mission->supplyingCompany->owner_user_id !== $user->id
                && $mission->supplying_company_id !== $mission->requesting_company_id) {
                try {
                    $notifications->notify(
                        $mission->supplyingCompany->owner,
                        'mission_completed',
                        $isEarlyTermination ? '⚠️ Mission clôturée de manière anticipée' : '🏁 Mission terminée',
                        "{$initiatorName} a clôturé la mission « " . ($mission->title ?? 'Mission') . " » pour {$mission->profile?->user?->name}." . ($isEarlyTermination ? " (Clôture anticipée)" : ""),
                        $mission,
                        ['url' => "/missions/{$mission->id}", 'mission_id' => $mission->id]
                    );
                } catch (\Exception $e) { \Log::warning('Notif failed: ' . $e->getMessage()); }
            }

            // ✅ NOUVELLE LOGIQUE : Notifier les entreprises en attente
            $offer = ResourceOffer::where('professional_profile_id', $mission->professional_profile_id)
                ->where('company_id', $mission->supplying_company_id)
                ->first();

            if ($offer) {
                $waitlist = ResourceOfferWaitlist::where('resource_offer_id', $offer->id)
                    ->where('status', 'waiting')
                    ->with('company.owner', 'user')
                    ->get();

                foreach ($waitlist as $entry) {
                    $entry->update(['status' => 'notified', 'notified_at' => now()]);

                    $owner = $entry->company->owner ?? null;
                    if ($owner) {
                        try {
                            $notifications->notify(
                                $owner,
                                'talent_available',
                                '🎉 Le talent est disponible !',
                                "{$entry->company->name}, le talent " . ($mission->profile?->user?->name ?? 'que vous attendiez') . " est maintenant libre. Vous pouvez lui proposer une mission.",
                                $offer,
                              ['url' => '/resource-offers/browse?tab=market&offer=' . $offer->id]
                            );
                        } catch (\Exception $e) { \Log::warning('Notif waitlist failed: ' . $e->getMessage()); }
                    }
                }
            }
        }

        if ($request->status === 'active' && $oldStatus !== 'active') {
            try {
                $notifications->notify(
                    $mission->profile->user,
                    'mission_accepted',
                    '🚀 La mission a démarré !',
                    "La mission « " . ($mission->title ?? 'Mission') . " » a officiellement commencé. Bon courage !",
                    $mission,
                    ['url' => "/missions/{$mission->id}", 'mission_id' => $mission->id]
                );
            } catch (\Exception $e) {
                \Log::warning('Notification failed: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Statut mis à jour',
            'mission' => $mission->fresh(['requestingCompany', 'supplyingCompany', 'profile.user', 'resourceOffer', 'proposal.resourceRequest'])
        ]);
    }

    public function validateTrial(Request $request, Mission $mission, NotificationService $notifications)
    {
        $this->authorizeRequestingCompany($request, $mission, 'valider la période d\'essai');

        if ($mission->status !== 'trial') {
            return response()->json(['message' => 'Cette mission n\'est pas en période d\'essai.'], 409);
        }

        DB::transaction(function () use ($mission) {
            $mission->update([
                'status'   => 'active',
                'end_at'   => null,
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

        $this->closeEmployee($mission);

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

    private function authorizeRequestingCompany(Request $request, Mission $mission, string $action): void
    {
        $companyIds = $request->user()->companies()->pluck('id')->toArray();

        abort_unless(
            in_array($mission->requesting_company_id, $companyIds),
            403,
            "Seul le recruteur peut {$action}."
        );
    }

    private function makeEmployee(Mission $mission): void
    {
        $company = $mission->requestingCompany;
        $talent  = $mission->profile?->user;

        if (!$company || !$talent) {
            return;
        }

        $position = $mission->title 
            ?? $mission->resourceOffer?->title
            ?? $mission->proposal?->resourceRequest?->title
            ?? 'Salarié';

        if ($position === $talent->name) {
            $position = 'Salarié';
        }

        $contractType = $mission->contract_type ?? 'permanent';
        
        if (!$mission->contract_type && $mission->jobOffer) {
            $contractType = $mission->jobOffer->offer_type ?? 'permanent';
        }

        $company->employees()->withTrashed()->updateOrCreate(
            ['user_id' => $talent->id],
            [
                'position'      => $position,
                'status'        => 'active',
                'contract_type' => $contractType,
                'start_date'    => $mission->started_at ?? $mission->start_at,
                'end_date'      => $mission->end_at,
                'email'         => $talent->email,
                'first_name'    => $talent->first_name ?: $talent->name,
                'last_name'     => $talent->last_name ?: '',
                'has_account'   => true,
                'deleted_at'    => null,
            ]
        );

        $company->members()->firstOrCreate(
            ['user_id' => $talent->id],
            ['role' => 'member', 'status' => 'active']
        );
    }

    private function closeEmployee(Mission $mission): void
    {
        if (!$mission->requesting_company_id || !$mission->profile?->user_id) return;
        if ($mission->supplying_company_id) return;

        \App\Models\Employee::where('company_id', $mission->requesting_company_id)
            ->where('user_id', $mission->profile->user_id)
            ->update([
                'status' => 'inactive',
                'end_date' => $mission->end_at
            ]);
    }
}