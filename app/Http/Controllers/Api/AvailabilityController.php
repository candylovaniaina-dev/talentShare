<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AvailabilityWindow;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Events\AvailabilityChanged;

class AvailabilityController extends Controller
{
    /**
     * Liste des disponibilités (avec filtres)
     */
    public function index(Request $request)
    {
        $profile = $request->user()->professionalProfile;

        if (! $profile) {
            return response()->json([]);
        }

        return $profile->availabilityWindows()
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->from, fn ($q, $d) => $q->where('end_at', '>=', $d))
            ->when($request->to, fn ($q, $d) => $q->where('start_at', '<=', $d))
            ->orderBy('start_at')
            ->get();
    }

    /**
     * Créer une disponibilité (vérifie les chevauchements)
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'start_at'         => ['required', 'date'],
            'end_at'           => ['required', 'date', 'after_or_equal:start_at'],
            'status'           => ['required', 'in:available,partially_available,unavailable,on_mission'],
            'type'             => ['required', 'in:full_time,part_time,freelance,internship,mission'],
            'workload_unit'    => ['required', 'in:percentage,hours_per_week,days_per_week'],
            'workload_value'   => ['required', 'integer', 'min:0', 'max:100'],
            'workload_percent' => ['nullable', 'integer', 'min:0', 'max:100'],
            'location_type'    => ['required', 'in:onsite,remote,hybrid'],
            'location_city'    => ['nullable', 'string', 'max:100'],
            'notes'            => ['nullable', 'string', 'max:1000'],
            'is_recurring'     => ['boolean'],
            'recurrence_pattern' => ['nullable', 'string', 'max:50'],
            'remote'           => ['boolean'],
        ]);

        $profile = $request->user()->professionalProfile;

        if (! $profile) {
            return response()->json(['message' => 'Créez d\'abord votre profil professionnel.'], 422);
        }

        // ✅ Vérification chevauchement
        $overlap = $this->findOverlap($profile->id, $data['start_at'], $data['end_at']);
        if ($overlap) {
            return response()->json([
                'message' => 'Cette période chevauche une disponibilité existante.',
                'conflict' => $overlap,
            ], 409);
        }

        // ✅ Vérification conflit avec missions actives
        $missionConflict = $this->findMissionConflict($profile->id, $data['start_at'], $data['end_at']);
        if ($missionConflict) {
            return response()->json([
                'message' => 'Cette période chevauche une mission existante.',
                'conflict' => $missionConflict,
            ], 409);
        }

        // Synchroniser workload_percent si workload_unit = percentage
        $data['workload_percent'] = $data['workload_unit'] === 'percentage'
            ? $data['workload_value']
            : $data['workload_percent'] ?? 100;

        // Sync remote avec location_type
        $data['remote'] = in_array($data['location_type'], ['remote', 'hybrid']);

       $window = $profile->availabilityWindows()->create($data);

// ✅ Dispatch event pour notifier les entreprises
event(new AvailabilityChanged($window, 'created'));

return response()->json($window, 201);
    }

    /**
     * Mettre à jour une disponibilité
     */
    public function update(Request $request, AvailabilityWindow $availabilityWindow)
    {
        $this->authorizeOwnership($request, $availabilityWindow);

        $data = $request->validate([
            'start_at'         => ['sometimes', 'date'],
            'end_at'           => ['sometimes', 'date', 'after_or_equal:start_at'],
            'status'           => ['sometimes', 'in:available,partially_available,unavailable,on_mission'],
            'type'             => ['sometimes', 'in:full_time,part_time,freelance,internship,mission'],
            'workload_unit'    => ['sometimes', 'in:percentage,hours_per_week,days_per_week'],
            'workload_value'   => ['sometimes', 'integer', 'min:0', 'max:100'],
            'workload_percent' => ['nullable', 'integer', 'min:0', 'max:100'],
            'location_type'    => ['sometimes', 'in:onsite,remote,hybrid'],
            'location_city'    => ['nullable', 'string', 'max:100'],
            'notes'            => ['nullable', 'string', 'max:1000'],
            'is_recurring'     => ['boolean'],
            'recurrence_pattern' => ['nullable', 'string', 'max:50'],
        ]);

        // Vérification chevauchement (en excluant soi-même)
        if (isset($data['start_at']) || isset($data['end_at'])) {
            $start = $data['start_at'] ?? $availabilityWindow->start_at;
            $end   = $data['end_at'] ?? $availabilityWindow->end_at;

            $overlap = $this->findOverlap(
                $availabilityWindow->professional_profile_id,
                $start,
                $end,
                $availabilityWindow->id
            );

            if ($overlap) {
                return response()->json([
                    'message' => 'Cette période chevauche une autre disponibilité.',
                    'conflict' => $overlap,
                ], 409);
            }
        }

        if (isset($data['location_type'])) {
            $data['remote'] = in_array($data['location_type'], ['remote', 'hybrid']);
        }

        $availabilityWindow->update($data);

// ✅ Dispatch event si le statut a changé
event(new AvailabilityChanged($availabilityWindow, 'updated'));

return response()->json($availabilityWindow);
    }

    /**
     * Supprimer (soft delete → historique conservé)
     */
    public function destroy(Request $request, AvailabilityWindow $availabilityWindow)
    {
        $this->authorizeOwnership($request, $availabilityWindow);

        $availabilityWindow->delete();

        return response()->json(['message' => 'Disponibilité supprimée.']);
    }

    /**
     * Vérifier un chevauchement (endpoint dédié pour le frontend)
     */
    public function checkOverlap(Request $request)
    {
        $data = $request->validate([
            'start_at' => ['required', 'date'],
            'end_at'   => ['required', 'date', 'after_or_equal:start_at'],
            'exclude_id' => ['nullable', 'integer'],
        ]);

        $profile = $request->user()->professionalProfile;
        if (! $profile) {
            return response()->json(['has_overlap' => false]);
        }

        $overlap = $this->findOverlap(
            $profile->id,
            $data['start_at'],
            $data['end_at'],
            $data['exclude_id'] ?? null
        );

        $missionConflict = $this->findMissionConflict(
            $profile->id,
            $data['start_at'],
            $data['end_at']
        );

        return response()->json([
            'has_overlap'      => (bool) $overlap,
            'has_mission_conflict' => (bool) $missionConflict,
            'availability_conflict' => $overlap,
            'mission_conflict' => $missionConflict,
        ]);
    }

    // ============================================
    // Helpers privés
    // ============================================

    private function authorizeOwnership(Request $request, AvailabilityWindow $window): void
    {
        $profileId = $request->user()->professionalProfile?->id;
        abort_unless($window->professional_profile_id === $profileId, 403, 'Non autorisé.');
    }

    private function findOverlap($profileId, $start, $end, $excludeId = null)
    {
        return AvailabilityWindow::where('professional_profile_id', $profileId)
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('start_at', [$start, $end])
                  ->orWhereBetween('end_at', [$start, $end])
                  ->orWhere(function ($q2) use ($start, $end) {
                      $q2->where('start_at', '<=', $start)
                         ->where('end_at', '>=', $end);
                  });
            })
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->first();
    }

    private function findMissionConflict($profileId, $start, $end)
    {
        return \App\Models\Mission::where('professional_profile_id', $profileId)
            ->whereIn('status', ['planned', 'active'])
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('start_at', [$start, $end])
                  ->orWhereBetween('end_at', [$start, $end])
                  ->orWhere(function ($q2) use ($start, $end) {
                      $q2->where('start_at', '<=', $start)
                         ->where('end_at', '>=', $end);
                  });
            })
            ->first();
    }
}