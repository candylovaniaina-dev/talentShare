<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certification;
use App\Models\Education;
use App\Models\Experience;
use App\Models\Language;
use Illuminate\Http\Request;

class ProfileSectionController extends Controller
{
    private function profile(Request $request)
    {
        $profile = $request->user()->professionalProfile;
        abort_if(! $profile, 422, 'Créez d\'abord votre profil professionnel.');
        return $profile;
    }

    // -------------------- Expériences --------------------

    public function storeExperience(Request $request)
    {
        $data = $request->validate([
            'title'       => ['required', 'string', 'max:150'],
            'company'     => ['required', 'string', 'max:150'],
            'location'    => ['nullable', 'string', 'max:120'],
            'start_date'  => ['required', 'date'],
            'end_date'    => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_current'  => ['boolean'],
            'description' => ['nullable', 'string'],
        ]);

        $experience = $this->profile($request)->experiences()->create($data);
        return response()->json($experience, 201);
    }

    public function updateExperience(Request $request, Experience $experience)
    {
        abort_unless($experience->professional_profile_id === $this->profile($request)->id, 403);
        $experience->update($request->validate([
            'title'       => ['sometimes', 'string', 'max:150'],
            'company'     => ['sometimes', 'string', 'max:150'],
            'location'    => ['nullable', 'string', 'max:120'],
            'start_date'  => ['sometimes', 'date'],
            'end_date'    => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_current'  => ['boolean'],
            'description' => ['nullable', 'string'],
        ]));
        return $experience;
    }

    public function destroyExperience(Request $request, Experience $experience)
    {
        abort_unless($experience->professional_profile_id === $this->profile($request)->id, 403);
        $experience->delete();
        return response()->json(['message' => 'Expérience supprimée.']);
    }

    // -------------------- Formations --------------------

    public function storeEducation(Request $request)
    {
        $data = $request->validate([
            'institution'     => ['required', 'string', 'max:150'],
            'degree'          => ['required', 'string', 'max:150'],
            'field_of_study'  => ['nullable', 'string', 'max:150'],
            'study_level'     => ['nullable', 'string', 'max:40'],      // ✅ AJOUT
            'start_date'      => ['nullable', 'date'],                   // ✅ nullable
            'end_date'        => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_current'      => ['boolean'],
            'is_young_talent' => ['boolean'],                            // ✅ AJOUT
        ]);

        // ✅ Fallback automatique si pas de start_date (Young Talent)
        if (empty($data['start_date'])) {
            $data['start_date'] = now()->startOfYear()->format('Y-m-d');
        }

        $education = $this->profile($request)->educations()->create($data);
        return response()->json($education, 201);
    }

    public function updateEducation(Request $request, Education $education)
    {
        abort_unless($education->professional_profile_id === $this->profile($request)->id, 403);
        
        $education->update($request->validate([
            'institution'     => ['sometimes', 'string', 'max:150'],
            'degree'          => ['sometimes', 'string', 'max:150'],
            'field_of_study'  => ['nullable', 'string', 'max:150'],
            'study_level'     => ['nullable', 'string', 'max:40'],       // ✅ AJOUT
            'start_date'      => ['sometimes', 'nullable', 'date'],      // ✅ nullable
            'end_date'        => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_current'      => ['boolean'],
            'is_young_talent' => ['boolean'],                             // ✅ AJOUT
        ]));
        return $education;
    }

    public function destroyEducation(Request $request, Education $education)
    {
        abort_unless($education->professional_profile_id === $this->profile($request)->id, 403);
        $education->delete();
        return response()->json(['message' => 'Formation supprimée.']);
    }

    // -------------------- Certifications --------------------

    public function storeCertification(Request $request)
    {
        $data = $request->validate([
            'name'                 => ['required', 'string', 'max:150'],
            'issuing_organization' => ['required', 'string', 'max:150'],
            'issue_date'           => ['required', 'date'],
            'credential_url'       => ['nullable', 'url'],
        ]);

        $certification = $this->profile($request)->certifications()->create($data);
        return response()->json($certification, 201);
    }

    public function updateCertification(Request $request, Certification $certification)
    {
        abort_unless($certification->professional_profile_id === $this->profile($request)->id, 403);
        $certification->update($request->validate([
            'name'                 => ['sometimes', 'string', 'max:150'],
            'issuing_organization' => ['sometimes', 'string', 'max:150'],
            'issue_date'           => ['sometimes', 'date'],
            'credential_url'       => ['nullable', 'url'],
        ]));
        return $certification;
    }

    public function destroyCertification(Request $request, Certification $certification)
    {
        abort_unless($certification->professional_profile_id === $this->profile($request)->id, 403);
        $certification->delete();
        return response()->json(['message' => 'Certification supprimée.']);
    }

    // -------------------- Langues --------------------

    public function storeLanguage(Request $request)
    {
        $data = $request->validate([
            'name'  => ['required', 'string', 'max:80'],
            'level' => ['required', 'in:basic,conversational,fluent,native'],
        ]);

        $language = $this->profile($request)->languages()->updateOrCreate(
            ['name' => $data['name']],
            ['level' => $data['level']]
        );
        return response()->json($language, 201);
    }

    public function updateLanguage(Request $request, Language $language)
    {
        abort_unless($language->professional_profile_id === $this->profile($request)->id, 403);
        $language->update($request->validate([
            'name'  => ['sometimes', 'string', 'max:80'],
            'level' => ['sometimes', 'in:basic,conversational,fluent,native'],
        ]));
        return $language;
    }

    public function destroyLanguage(Request $request, Language $language)
    {
        abort_unless($language->professional_profile_id === $this->profile($request)->id, 403);
        $language->delete();
        return response()->json(['message' => 'Langue supprimée.']);
    }
}