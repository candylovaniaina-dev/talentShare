<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Company\FacultyRequest;
use App\Models\Faculty;
use App\Models\University;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FacultyController extends Controller
{
    public function index(University $university, Request $request)
    {
        $query = $university->faculties()->latest();

        if ($search = $request->query('search')) {
            $query->where('name', 'ILIKE', "%{$search}%");
        }

        return $query->paginate($request->input('per_page', 15));
    }

    public function show(Faculty $faculty): Faculty
    {
        return $faculty->load('university:id,name,slug');
    }

    public function store(FacultyRequest $request, University $university): JsonResponse
    {
        $this->authorize('update', $university);

        $data = $request->validated();
        $data['university_id'] = $university->id;
        $data['slug'] = $data['slug'] ?? $this->uniqueSlug($university, $data['name']);

        $faculty = Faculty::create($data);

        return response()->json($faculty, 201);
    }

    public function update(FacultyRequest $request, Faculty $faculty): Faculty
    {
        $this->authorize('update', $faculty->university);

        $data = $request->validated();

        if (isset($data['name']) && $data['name'] !== $faculty->name && empty($data['slug'])) {
            $data['slug'] = $this->uniqueSlug($faculty->university, $data['name'], $faculty->id);
        }

        $faculty->update($data);

        return $faculty->fresh();
    }

    public function destroy(Faculty $faculty): JsonResponse
    {
        $this->authorize('update', $faculty->university);

        $faculty->delete();

        return response()->json(['message' => 'Faculté supprimée.'], 200);
    }

    private function uniqueSlug(University $university, string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 1;

        while (
            $university->faculties()
                ->where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}