<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Skill;
use App\Models\SkillCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SkillController extends Controller
{
    // ✅ CORRECTION ICI : Ajout de Request $request pour gérer parent_id
    public function categories(Request $request)
    {
        $query = SkillCategory::query();

        // Si React demande les sous-catégories d'une catégorie précise
        if ($request->has('parent_id')) {
            $parentId = $request->query('parent_id');
            
            if ($parentId === 'null' || $parentId === null || $parentId === '') {
                $query->whereNull('parent_id');
            } else {
                $query->where('parent_id', $parentId);
            }
        } else {
            // Par défaut (si aucun paramètre n'est envoyé), on renvoie les catégories racines
            $query->whereNull('parent_id');
        }

        return $query
            ->with(['children.skills', 'skills'])
            ->orderBy('position')
            ->orderBy('name')
            ->get();
    }

    public function index(Request $request)
    {
        return Skill::query()
            ->with(['category', 'category.parent'])
            ->when($request->search, fn ($q, $search) => $q->where('name', 'ilike', "%{$search}%"))
            ->when($request->category_id, fn ($q, $id) => $q->where('skill_category_id', $id))
            ->when($request->sort === 'popular', fn ($q) =>
                $q->withCount('profiles')->orderByDesc('profiles_count')
            )
            ->when($request->sort !== 'popular', fn ($q) => $q->orderBy('name'))
            ->limit($request->limit ?? 500)
            ->get();
    }

    public function attach(Request $request)
    {
        $data = $request->validate([
            'skill_id'         => ['required', 'exists:skills,id'],
            'level'            => ['required', 'in:beginner,intermediate,advanced,expert'],
            'years_experience' => ['nullable', 'integer', 'min:0', 'max:60'],
            'notes'            => ['nullable', 'string', 'max:500'],
            'is_featured'      => ['nullable', 'boolean'],
        ]);

        $profile = $request->user()->professionalProfile;

        if (! $profile) {
            return response()->json(['message' => 'Créez d\'abord votre profil professionnel.'], 422);
        }

        $profile->skills()->syncWithoutDetaching([
            $data['skill_id'] => [
                'level'            => $data['level'],
                'years_experience' => $data['years_experience'] ?? null,
                'notes'            => $data['notes'] ?? null,
                'is_featured'      => $data['is_featured'] ?? false,
            ],
        ]);

        return response()->json($profile->load('skills.category.parent'), 201);
    }

    public function updateLevel(Request $request, Skill $skill)
    {
        $data = $request->validate([
            'level'            => ['sometimes', 'in:beginner,intermediate,advanced,expert'],
            'years_experience' => ['nullable', 'integer', 'min:0', 'max:60'],
            'notes'            => ['nullable', 'string', 'max:500'],
            'is_featured'      => ['sometimes', 'boolean'],
        ]);

        $profile = $request->user()->professionalProfile;

        if (! $profile) {
            return response()->json(['message' => 'Profil non trouvé.'], 422);
        }

        $profile->skills()->updateExistingPivot($skill->id, $data);

        return response()->json($profile->load('skills.category.parent'));
    }

    public function detach(Request $request, Skill $skill)
    {
        $profile = $request->user()->professionalProfile;

        if ($profile) {
            $profile->skills()->detach($skill->id);
        }

        return response()->json(['message' => 'Compétence retirée.']);
    }

   public function store(Request $request)
{
    $data = $request->validate([
        'name'              => ['required', 'string', 'max:100'],
        // ✅ On accepte les deux noms de champs
        'skill_category_id' => ['nullable', 'exists:skill_categories,id'],
        'category_id'       => ['nullable', 'exists:skill_categories,id'],
        'description'       => ['nullable', 'string', 'max:500'],
    ]);

    $categoryId = $data['skill_category_id'] ?? $data['category_id'] ?? null;

    $slug = Str::slug($data['name']);
    $original = $slug;
    $i = 1;
    while (Skill::where('slug', $slug)->exists()) {
        $slug = $original . '-' . $i++;
    }

    $skill = Skill::create([
        'name'              => $data['name'],
        'slug'              => $slug,
        'skill_category_id' => $categoryId,
        'description'       => $data['description'] ?? null,
    ]);

    return response()->json($skill->load('category'), 201);
}

    public function stats()
    {
        return SkillCategory::whereNull('parent_id')
            ->withCount(['skills'])
            ->orderBy('position')
            ->get();
    }
        public function storeCategory(Request $request)
    {
        $data = $request->validate([
            'name'      => ['required', 'string', 'max:100'],
            'parent_id' => ['nullable', 'exists:skill_categories,id'],
        ]);

        // ✅ Génération du slug unique pour éviter l'erreur NOT NULL
        $slug = Str::slug($data['name']);
        $originalSlug = $slug;
        $i = 1;
        while (SkillCategory::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $i++;
        }

        $category = SkillCategory::create([
            'name'      => $data['name'],
            'slug'      => $slug, // ✅ On ajoute le slug ici
            'parent_id' => $data['parent_id'] ?? null,
        ]);

        return response()->json($category, 201);
    }
}