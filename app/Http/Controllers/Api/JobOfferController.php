<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\JobOffer\JobOfferRequest;
use App\Models\JobOffer;
use Illuminate\Http\Request;

class JobOfferController extends Controller
{
    public function index(Request $request)
    {
        return JobOffer::query()
            ->where('status', 'published')
            ->with(['company:id,name,logo_path,city,country', 'skills'])
            ->when($request->offer_type, fn ($q, $v) => $q->where('offer_type', $v))
            ->when($request->skill_id, function ($q, $skillId) {
                $q->whereHas('skills', fn ($sq) => $sq->where('skills.id', $skillId));
            })
            ->when($request->country, fn ($q, $v) => $q->where('country', $v))
            ->when($request->boolean('remote'), fn ($q) => $q->where('remote', true))
            ->latest()
            ->paginate($request->get('per_page', 15));
    }

    public function show(JobOffer $jobOffer)
    {
        return $jobOffer->load(['company', 'skills']);
    }

    public function store(JobOfferRequest $request)
    {
        if ($request->user()->companies()->where('id', $request->company_id)->doesntExist()) {
            return response()->json(['message' => 'Cette entreprise ne vous appartient pas.'], 403);
        }

        $data = $request->validated();
        $skills = $data['skills'] ?? [];
        unset($data['skills']);
        $data['created_by'] = $request->user()->id;

        $jobOffer = JobOffer::create($data);

        if ($skills) {
            $jobOffer->skills()->sync(
                collect($skills)->mapWithKeys(fn ($s) => [$s['skill_id'] => ['min_level' => $s['min_level']]])
            );
        }

        return response()->json($jobOffer->load('skills'), 201);
    }

    public function update(JobOfferRequest $request, JobOffer $jobOffer)
    {
        $this->authorize('update', $jobOffer);

        $data = $request->validated();
        $skills = $data['skills'] ?? null;
        unset($data['skills']);

        $jobOffer->update($data);

        if ($skills !== null) {
            $jobOffer->skills()->sync(
                collect($skills)->mapWithKeys(fn ($s) => [$s['skill_id'] => ['min_level' => $s['min_level']]])
            );
        }

        return $jobOffer->load('skills');
    }

    public function destroy(JobOffer $jobOffer)
    {
        $this->authorize('delete', $jobOffer);
        $jobOffer->delete();

        return response()->json(['message' => 'Offre supprimée.']);
    }

    public function applications(JobOffer $jobOffer)
    {
        $this->authorize('viewApplications', $jobOffer);

        return $jobOffer->applications()->with('profile.user', 'portfolio')->latest()->get();
    }
}