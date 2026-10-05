<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\University;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UniversityStudentController extends Controller
{
    /**
     * Liste les étudiants de mon université.
     * Filtres possibles : ?status=pending|approved|rejected
     */
    public function index(Request $request, University $university)
    {
        // Vérifier que l'utilisateur peut voir les étudiants de cette université
        $this->authorize('view', $university);

        $query = $university->students()
            ->with(['professionalProfile:id,user_id,headline,bio,profile_type,avatar_path,study_level,field_of_study'])
            ->latest();

        // Filtre par statut
        if ($status = $request->query('status')) {
            $query->where('university_status', $status);
        }

        // Recherche par nom ou email
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('email', 'ILIKE', "%{$search}%");
            });
        }

        return $query->paginate($request->input('per_page', 15));
    }

    /**
     * Liste uniquement les étudiants en attente de validation.
     */
    public function pending(Request $request, University $university)
    {
        $this->authorize('update', $university);

        return $university->pendingStudents()
            ->latest()
            ->paginate($request->input('per_page', 15));
    }

    /**
     * Statistiques sur les étudiants.
     */
    public function stats(University $university): JsonResponse
    {
        $this->authorize('view', $university);

        return response()->json([
            'total'    => $university->students()->count(),
            'pending'  => $university->pendingStudents()->count(),
            'approved' => $university->approvedStudents()->count(),
            'rejected' => $university->rejectedStudents()->count(),
        ]);
    }

    /**
     * Valider un étudiant (le référencer).
     */
    public function approve(University $university, User $student): JsonResponse
    {
        $this->authorize('update', $university);

        // Vérifier que l'étudiant est bien rattaché à cette université
        if ($student->university_id !== $university->id) {
            return response()->json([
                'message' => 'Cet étudiant n\'est pas rattaché à cette université.'
            ], 403);
        }

        // Vérifier que c'est bien un étudiant
        if ($student->role !== 'student') {
            return response()->json([
                'message' => 'Cet utilisateur n\'est pas un étudiant.'
            ], 422);
        }

        $student->update([
            'university_status'      => 'approved',
            'university_verified_at' => now(),
        ]);

        return response()->json([
            'message' => 'Étudiant validé avec succès.',
            'student' => $student->fresh(),
        ]);
    }

    /**
     * Refuser un étudiant.
     */
    public function reject(University $university, User $student): JsonResponse
    {
        $this->authorize('update', $university);

        if ($student->university_id !== $university->id) {
            return response()->json([
                'message' => 'Cet étudiant n\'est pas rattaché à cette université.'
            ], 403);
        }

        $student->update([
            'university_status'      => 'rejected',
            'university_verified_at' => null,
        ]);

        return response()->json([
            'message' => 'Étudiant refusé.',
            'student' => $student->fresh(),
        ]);
    }

    /**
     * Retirer un étudiant de l'université.
     */
    public function remove(University $university, User $student): JsonResponse
    {
        $this->authorize('update', $university);

        if ($student->university_id !== $university->id) {
            return response()->json([
                'message' => 'Cet étudiant n\'est pas rattaché à cette université.'
            ], 403);
        }

        $student->update([
            'university_id'          => null,
            'university_status'      => null,
            'university_verified_at' => null,
        ]);

        return response()->json([
            'message' => 'Étudiant retiré de l\'université.',
        ]);
    }
}