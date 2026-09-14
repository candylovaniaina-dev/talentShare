<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ResourceRequest\ResourceRequestRequest;
use App\Models\ResourceRequest;
use App\Services\MatchingService;
use Illuminate\Http\Request;

class ResourceRequestController extends Controller
{
    public function index(Request $request)
    {
        return ResourceRequest::query()
            ->where('status', 'published')
            ->with(['company:id,name,logo_path,city,country', 'skills'])
            ->when($request->skill_id, function ($q, $skillId) {
                $q->whereHas('skills', fn ($sq) => $sq->where('skills.id', $skillId));
            })
            ->when($request->country, fn ($q, $v) => $q->where('country', $v))
            ->when($request->boolean('remote'), fn ($q) => $q->where('remote', true))
            ->latest()
            ->paginate($request->get('per_page', 15));
    }

    public function show(ResourceRequest $resourceRequest)
    {
        return $resourceRequest->load(['company', 'skills']);
    }

    public function store(ResourceRequestRequest $request)
    {
        if ($request->user()->companies()->where('id', $request->company_id)->doesntExist()) {
            return response()->json(['message' => 'Cette entreprise ne vous appartient pas.'], 403);
        }

        $data = $request->validated();
        $skills = $data['skills'] ?? [];
        unset($data['skills']);
        $data['created_by'] = $request->user()->id;

        $resourceRequest = ResourceRequest::create($data);

        if ($skills) {
            $resourceRequest->skills()->sync(
                collect($skills)->mapWithKeys(fn ($s) => [$s['skill_id'] => ['min_level' => $s['min_level']]])
            );
        }

        return response()->json($resourceRequest->load('skills'), 201);
    }

    public function update(ResourceRequestRequest $request, ResourceRequest $resourceRequest)
    {
        $this->authorize('update', $resourceRequest);

        $data = $request->validated();
        $skills = $data['skills'] ?? null;
        unset($data['skills']);

        $resourceRequest->update($data);

        if ($skills !== null) {
            $resourceRequest->skills()->sync(
                collect($skills)->mapWithKeys(fn ($s) => [$s['skill_id'] => ['min_level' => $s['min_level']]])
            );
        }

        return $resourceRequest->load('skills');
    }

    public function destroy(ResourceRequest $resourceRequest)
    {
        $this->authorize('delete', $resourceRequest);
        $resourceRequest->delete();

        return response()->json(['message' => 'Demande supprimée.']);
    }

    public function candidates(ResourceRequest $resourceRequest, MatchingService $matching)
    {
        $this->authorize('viewCandidates', $resourceRequest);

        $ranked = $matching->rankCandidates($resourceRequest);

        return response()->json(
            $ranked->map(fn ($item) => [
                'profile_id' => $item['profile']->id,
                'name' => $item['profile']->user->name,
                'headline' => $item['profile']->headline,
                'match' => $item['match'],
            ])
        );
    }
}