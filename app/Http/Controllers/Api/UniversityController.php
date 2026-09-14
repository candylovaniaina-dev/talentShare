<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Company\UniversityRequest;
use App\Models\University;
use Illuminate\Support\Str;

class UniversityController extends Controller
{
    public function index()
    {
        return University::query()
            ->latest()
            ->paginate(request('per_page', 15));
    }

    public function show(University $university)
    {
        return $university;
    }

    public function store(UniversityRequest $request)
    {
        $data = $request->validated();
        $data['owner_user_id'] = $request->user()->id;
        $data['slug'] = $this->uniqueSlug($data['name']);

        $university = University::create($data);

        return response()->json($university, 201);
    }

    public function update(UniversityRequest $request, University $university)
    {
        $this->authorize('update', $company);

        $data = $request->validated();
        if ($data['name'] !== $university->name) {
            $data['slug'] = $this->uniqueSlug($data['name'], $university->id);
        }

        $university->update($data);

        return $university;
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 1;

        while (Company::where('slug', $slug)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = "{$base}-" . $i++;
        }

        return $slug;
    }
}