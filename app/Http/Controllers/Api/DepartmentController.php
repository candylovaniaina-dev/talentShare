<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Company\DepartmentRequest;
use App\Models\Department;
use App\Models\Faculty;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DepartmentController extends Controller
{
    public function index(Faculty $faculty, Request $request)
    {
        $query = $faculty->departments()->latest();

        if ($search = $request->query('search')) {
            $query->where('name', 'ILIKE', "%{$search}%");
        }

        return $query->paginate($request->input('per_page', 15));
    }

    public function show(Department $department): Department
    {
        return $department->load('faculty:id,name,slug,university_id');
    }

    public function store(DepartmentRequest $request, Faculty $faculty): JsonResponse
    {
        $this->authorize('update', $faculty->university);

        $data = $request->validated();
        $data['faculty_id'] = $faculty->id;
        $data['slug'] = $data['slug'] ?? $this->uniqueSlug($faculty, $data['name']);

        $department = Department::create($data);

        return response()->json($department, 201);
    }

    public function update(DepartmentRequest $request, Department $department): Department
    {
        $this->authorize('update', $department->faculty->university);

        $data = $request->validated();

        if (isset($data['name']) && $data['name'] !== $department->name && empty($data['slug'])) {
            $data['slug'] = $this->uniqueSlug($department->faculty, $data['name'], $department->id);
        }

        $department->update($data);

        return $department->fresh();
    }

    public function destroy(Department $department): JsonResponse
    {
        $this->authorize('update', $department->faculty->university);

        $department->delete();

        return response()->json(['message' => 'Département supprimé.'], 200);
    }

    private function uniqueSlug(Faculty $faculty, string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 1;

        while (
            $faculty->departments()
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