<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mission;
use App\Models\ResourceOffer;
use App\Services\NotificationService;
use Illuminate\Http\Request;

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

        // ✅ Vérifier mission existante
        $existing = Mission::where('resource_offer_id', $offer->id)
            ->whereIn('status', ['pending_employee', 'planned', 'active'])
            ->exists();

        if ($existing) {
            return response()->json(['message' => 'Une mission est déjà en cours pour cette offre.'], 409);
        }

        // ✅ Vérifier que l'offre est bien publiée
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

        // ❌ SUPPRIMÉ : plus de $offer->update(['status' => 'closed'])
        // ✅ L'offre reste publiée pendant la phase pending_employee.

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

        // ✅ Maintenant on ferme l'offre (plus personne ne peut postuler)
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

        // ✅ L'offre reste publiée (elle n'a jamais été fermée)
        // Pas besoin de update car on ne la ferme plus dans store()

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
        $companyIds = $request->user()->companies()->pluck('id');
        abort_unless(
            $companyIds->contains($mission->requesting_company_id) ||
            $companyIds->contains($mission->supplying_company_id),
            403
        );

        $data = $request->validate([
            'status' => ['required', 'in:planned,active,completed,cancelled']
        ]);

        $mission->update($data);

        // ✅ Quand la mission est terminée, on clôture l'offre
        if ($data['status'] === 'completed') {
            $mission->resourceOffer?->update(['status' => 'closed']);
        }

        // Si annulée après acceptation, on rouvre l'offre
        if ($data['status'] === 'cancelled' && $mission->resourceOffer?->status === 'closed') {
            $mission->resourceOffer->update(['status' => 'published']);
        }

        return $mission->load(['profile.user', 'supplyingCompany', 'requestingCompany']);
    }
}