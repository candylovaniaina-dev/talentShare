<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Company\UniversityRequest;
use App\Models\University;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UniversityController extends Controller
{
    /**
     * Liste paginée des universités.
     */
    public function index(Request $request)
    {
        $query = University::query()
            ->with('owner:id,name,email')
            ->latest();

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('city', 'ILIKE', "%{$search}%")
                  ->orWhere('country', 'ILIKE', "%{$search}%");
            });
        }

        if ($country = $request->query('country')) {
            $query->where('country', $country);
        }

        if ($request->has('verified')) {
            $query->where('is_verified', $request->boolean('verified'));
        }

        return $query->paginate($request->input('per_page', 15));
    }

    /**
     * Affiche une université.
     */
    public function show(University $university): University
    {
        return $university->load(['owner:id,name,email']);
    }

    /**
     * Crée une nouvelle université.
     */
    public function store(UniversityRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['owner_user_id'] = $request->user()->id;
        $data['slug'] = $data['slug'] ?? $this->uniqueSlug($data['name']);

        $university = University::create($data);

        return response()->json($university->load('owner:id,name,email'), 201);
    }

    /**
     * Met à jour une université.
     */
    public function update(UniversityRequest $request, University $university): University
    {
        $this->authorize('update', $university);

        $data = $request->validated();

        if (isset($data['name']) && $data['name'] !== $university->name && empty($data['slug'])) {
            $data['slug'] = $this->uniqueSlug($data['name'], $university->id);
        }

        $university->update($data);

        return $university->fresh()->load('owner:id,name,email');
    }

    /**
     * Supprime une université.
     */
    public function destroy(University $university): JsonResponse
    {
        $this->authorize('delete', $university);

        $university->delete();

        return response()->json(['message' => 'Université supprimée.'], 200);
    }

    /**
     * Génère un slug unique.
     */
    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 1;

        while (
            University::where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
        /**
     * Liste les universités de l'utilisateur connecté.
     */
    public function myUniversities(Request $request)
    {
        return University::where('owner_user_id', $request->user()->id)
            ->with('owner:id,name,email')
            ->latest()
            ->get();
    }
}