<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Skill;
use App\Models\SkillCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SkillController extends Controller
{
    public function categories()
    {
        return SkillCategory::whereNull('parent_id')
            ->with(['children.skills', 'skills'])
            ->orderBy('position')
            ->orderBy('name')
            ->get();
    }

    public function index(Request $request)
{
    return Skill::query()
        ->with(['category', 'category.parent'])  // ✅ CHARGE AUSSI LE PARENT
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
            'skill_category_id' => ['nullable', 'exists:skill_categories,id'],
            'description'       => ['nullable', 'string', 'max:500'],
        ]);

        $slug = Str::slug($data['name']);
        $original = $slug;
        $i = 1;
        while (Skill::where('slug', $slug)->exists()) {
            $slug = $original . '-' . $i++;
        }

        $skill = Skill::create([
            'name'              => $data['name'],
            'slug'              => $slug,
            'skill_category_id' => $data['skill_category_id'] ?? null,
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
}