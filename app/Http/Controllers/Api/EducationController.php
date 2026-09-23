<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\EducationRequest;
use App\Models\Education;
use Illuminate\Http\Request;

class EducationController extends Controller
{
    /**
     * Liste des formations du profil courant
     */
    public function index(Request $request)
    {
        $profile = $request->user()->professionalProfile;
        if (!$profile) {
            return response()->json(['message' => 'Profil introuvable'], 404);
        }
        return response()->json($profile->educations);
    }

    /**
     * Créer une formation
     */
    public function store(EducationRequest $request)
    {
        $profile = $request->user()->professionalProfile;
        if (!$profile) {
            return response()->json(['message' => 'Profil introuvable'], 404);
        }

        $education = $profile->educations()->create($request->validated());

        // Si Young Talent et c'est la première formation, on met à jour le profil
        if ($request->boolean('is_young_talent')) {
            $profile->update([
                'is_young_talent' => true,
                'university' => $education->institution,
                'field_of_study' => $education->field_of_study,
                'study_level' => $education->study_level,
            ]);
        }

        return response()->json($education, 201);
    }

    /**
     * Afficher une formation
     */
    public function show(Request $request, Education $education)
    {
        $this->authorizeOwnership($request, $education);
        return response()->json($education);
    }

    /**
     * Mettre à jour une formation
     */
    public function update(EducationRequest $request, Education $education)
    {
        $this->authorizeOwnership($request, $education);
        $education->update($request->validated());

        // Sync avec le profil si Young Talent
        if ($education->is_young_talent) {
            $education->profile->update([
                'university' => $education->institution,
                'field_of_study' => $education->field_of_study,
                'study_level' => $education->study_level,
            ]);
        }

        return response()->json($education);
    }

    /**
     * Supprimer une formation
     */
    public function destroy(Request $request, Education $education)
    {
        $this->authorizeOwnership($request, $education);
        $education->delete();
        return response()->json(['message' => 'Formation supprimée']);
    }

    private function authorizeOwnership(Request $request, Education $education): void
    {
        $profile = $request->user()->professionalProfile;
        if (!$profile || $education->professional_profile_id !== $profile->id) {
            abort(403, 'Non autorisé');
        }
    }
}