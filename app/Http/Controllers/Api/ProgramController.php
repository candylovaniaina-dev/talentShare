<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Company\ProgramRequest;
use App\Models\Department;
use App\Models\Program;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProgramController extends Controller
{
    public function index(Department $department, Request $request)
    {
        $query = $department->programs()->latest();

        if ($search = $request->query('search')) {
            $query->where('name', 'ILIKE', "%{$search}%");
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        return $query->paginate($request->input('per_page', 15));
    }

    public function show(Program $program): Program
    {
        return $program->load('department:id,name,slug,faculty_id');
    }

    public function store(ProgramRequest $request, Department $department): JsonResponse
    {
        $this->authorize('update', $department->faculty->university);

        $data = $request->validated();
        $data['department_id'] = $department->id;
        $data['slug'] = $data['slug'] ?? $this->uniqueSlug($department, $data['name']);

        $program = Program::create($data);

        return response()->json($program, 201);
    }

    public function update(ProgramRequest $request, Program $program): Program
    {
        $this->authorize('update', $program->department->faculty->university);

        $data = $request->validated();

        if (isset($data['name']) && $data['name'] !== $program->name && empty($data['slug'])) {
            $data['slug'] = $this->uniqueSlug($program->department, $data['name'], $program->id);
        }

        $program->update($data);

        return $program->fresh();
    }

    public function destroy(Program $program): JsonResponse
    {
        $this->authorize('update', $program->department->faculty->university);

        $program->delete();

        return response()->json(['message' => 'Formation supprimée.'], 200);
    }

    private function uniqueSlug(Department $department, string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 1;

        while (
            $department->programs()
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