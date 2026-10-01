<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Portfolio;
use App\Models\PortfolioProject;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PortfolioController extends Controller
{
    /**
     * Récupérer ou créer automatiquement le portfolio de l'utilisateur
     */
   public function myPortfolio(Request $request)
{
    $user = $request->user();
    $profile = $user->professionalProfile;

    if (!$profile) {
        return response()->json([
            'message' => 'Créez d\'abord votre profil professionnel.',
        ], 422);
    }

    // ✅ NETTOYAGE : supprime les portfolios orphelins (mauvais profile_id)
    \App\Models\Portfolio::where('professional_profile_id', '!=', $profile->id)
        ->whereNotIn('professional_profile_id', 
            \App\Models\ProfessionalProfile::pluck('id')
        )
        ->delete();

    try {
        $portfolio = \App\Models\Portfolio::firstOrCreate(
            ['professional_profile_id' => $profile->id],
            [
                'title' => 'Mon portfolio',
                'summary' => 'Portfolio de ' . $user->name,
                'visibility' => 'public',
                'public_slug' => \Illuminate\Support\Str::slug($user->name) . '-' . \Illuminate\Support\Str::random(6),
                'theme' => 'minimal',
                'accent_color' => '#6EE7C8',
            ]
        );
    } catch (\Exception $e) {
        \Log::error('Erreur création portfolio: ' . $e->getMessage());
        return response()->json([
            'message' => 'Erreur lors de la création du portfolio',
            'debug' => $e->getMessage(),
        ], 500);
    }

    $portfolio->load('projects');

    return response()->json($portfolio);
}

    /**
     * Créer un portfolio
     */
    public function store(Request $request)
    {
        $profile = $request->user()->professionalProfile;

        if (!$profile) {
            return response()->json(['message' => 'Créez d\'abord votre profil professionnel.'], 422);
        }

        $existing = Portfolio::where('professional_profile_id', $profile->id)->first();
        if ($existing) {
            $existing->load('projects');
            return response()->json($existing, 200);
        }

        $portfolio = Portfolio::create([
            'professional_profile_id' => $profile->id,
            'title' => $request->title ?? 'Mon portfolio',
            'summary' => $request->summary,
            'visibility' => $request->visibility ?? 'public',
            'public_slug' => Str::slug($request->user()->name) . '-' . Str::random(6),
        ]);

        $portfolio->load('projects');
        return response()->json($portfolio, 201);
    }

    /**
     * Mettre à jour le portfolio
     */
    public function update(Request $request)
    {
        $profile = $request->user()->professionalProfile;
        if (!$profile) {
            return response()->json(['message' => 'Créez d\'abord votre profil professionnel.'], 422);
        }

        $portfolio = Portfolio::where('professional_profile_id', $profile->id)->first();
        if (!$portfolio) {
            return response()->json(['message' => 'Portfolio non trouvé.'], 404);
        }

        $data = $request->validate([
            'title'        => ['sometimes', 'string', 'max:180'],
            'summary'      => ['nullable', 'string'],
            'visibility'   => ['sometimes', 'in:public,private'],
            'theme'        => ['sometimes', 'in:minimal,bold,corporate,vibrant'],
            'accent_color' => ['sometimes', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ]);

        $portfolio->update($data);

        return response()->json($portfolio);
    }

    /**
     * Ajouter un projet - Crée le portfolio automatiquement
     */
    public function addProject(Request $request)
    {
        $profile = $request->user()->professionalProfile;
        
        if (!$profile) {
            return response()->json(['message' => 'Créez d\'abord votre profil professionnel.'], 422);
        }
        
        $portfolio = Portfolio::firstOrCreate(
            ['professional_profile_id' => $profile->id],
            [
                'title' => 'Mon portfolio',
                'visibility' => 'public',
                'public_slug' => Str::slug($request->user()->name) . '-' . Str::random(6),
            ]
        );

        $data = $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'description' => ['nullable', 'string'],
            'project_url' => ['nullable', 'url'],
            'cover_image_path' => ['nullable', 'string'],
            'position' => ['nullable', 'integer', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'technologies' => ['nullable', 'array'],
            // ✅ AJOUT : type de projet (Young Talent)
            'project_type' => ['nullable', 'in:academic,personal,professional'],
        ]);

        $project = $portfolio->projects()->create($data);
        
        return response()->json($project, 201);
    }

    /**
     * Mettre à jour un projet
     */
    public function updateProject(Request $request, PortfolioProject $project)
    {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:180'],
            'description' => ['nullable', 'string'],
            'project_url' => ['nullable', 'url'],
            'cover_image_path' => ['nullable', 'string'],
            'position' => ['nullable', 'integer', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'technologies' => ['nullable', 'array'],
            // ✅ AJOUT : type de projet (Young Talent)
            'project_type' => ['nullable', 'in:academic,personal,professional'],
        ]);

        $project->update($data);

        return response()->json($project);
    }

    /**
     * Supprimer un projet
     */
    public function deleteProject(PortfolioProject $project)
    {
        $project->delete();
        return response()->json(['message' => 'Projet supprimé avec succès ✅']);
    }

    /**
     * Mettre à jour la visibilité
     */
    public function updateVisibility(Request $request)
    {
        $profile = $request->user()->professionalProfile;
        $portfolio = Portfolio::where('professional_profile_id', $profile->id)->first();

        if (!$portfolio) {
            return response()->json(['message' => 'Portfolio non trouvé.'], 404);
        }

        $data = $request->validate([
            'visibility' => ['required', 'in:public,private'],
        ]);

        $portfolio->update(['visibility' => $data['visibility']]);

        return response()->json([
            'message' => 'Visibilité mise à jour ✅',
            'portfolio' => $portfolio
        ]);
    }

    /**
     * Page publique du portfolio
     */
    public function show(Request $request, string $slug)
    {
        $portfolio = Portfolio::where('public_slug', $slug)
            ->with([
                'projects',
                'profile.user',
                'profile.skills.category.parent',
                'profile.skills.category',
                'profile.experiences',
                'profile.educations',
                'profile.certifications',
                'profile.languages',
                'profile.availabilityWindows',
            ])
            ->first();

        if (!$portfolio) {
            abort(404);
        }

        $user = auth('sanctum')->user();
        $isOwner = $user && $portfolio->profile->user_id === $user->id;

        if ($portfolio->visibility !== 'public' && !$isOwner) {
            abort(404);
        }

        $profile = $portfolio->profile;

        $portfolio->is_owner = $isOwner;
        $portfolio->profile_data = [
            // === Infos de base ===
            'user_id'      => $profile->user_id,
            'name'         => $profile->user->name,
            'headline'     => $profile->headline,
            'bio'          => $profile->bio,
            'avatar'       => $profile->avatar_path,
            'city'         => $profile->city,
            'country'      => $profile->country,
            'profile_type' => $profile->profile_type,
            'is_verified'  => $profile->is_verified,
            'cv_path'      => $profile->cv_path,

            // ✅ AJOUT : Champs Young Talent
            'is_young_talent'         => $profile->is_young_talent,
            'looking_for_opportunity' => $profile->looking_for_opportunity,
            'university'              => $profile->university,
            'field_of_study'          => $profile->field_of_study,
            'study_level'             => $profile->study_level,

            // ✅ User (phone, country d'origine)
            'user' => [
                'first_name' => $profile->user->first_name,
                'last_name'  => $profile->user->last_name,
                'phone'      => $profile->user->phone,
                'country'    => $profile->user->country,
            ],

            // === Sections ===
            'skills'         => $profile->skills,
            'experiences'    => $profile->experiences,
            'educations'     => $profile->educations,
            'certifications' => $profile->certifications,
            'languages'      => $profile->languages,
            'availability_windows' => $profile->availabilityWindows()
                ->where('end_at', '>=', now()->startOfDay())
                ->orderBy('start_at')
                ->get(),

            // === Liens externes ===
            'links' => [
                'portfolio' => $profile->portfolio_url,
                'linkedin'  => $profile->linkedin_url,
                'github'    => $profile->github_url,
                'behance'   => $profile->behance_url,
            ],
        ];

        return response()->json($portfolio);
    }
}