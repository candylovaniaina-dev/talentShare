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

    /**
     * ✅ Liste les candidatures d'une offre (recruteur)
     */
    public function applications(Request $request, JobOffer $jobOffer)
    {
        // Autorisation
        $isOwner = $request->user()->companies()
            ->where('id', $jobOffer->company_id)->exists();

        abort_unless($isOwner, 403, 'Non autorisé.');

        // Charger les candidatures avec toutes les relations
        $applications = $jobOffer->applications()
            ->with([
                'profile.user:id,name,email,phone,first_name,last_name',
                'profile.skills.category.parent',
                'profile.skills.category',
                'profile.educations',
                'profile.experiences',
                'portfolio:id,title,public_slug',
            ])
            ->orderByRaw("CASE status 
                WHEN 'interview' THEN 1
                WHEN 'shortlisted' THEN 2
                WHEN 'viewed' THEN 3
                WHEN 'sent' THEN 4
                WHEN 'accepted' THEN 5
                WHEN 'rejected' THEN 6
                ELSE 7 END")
            ->latest()
            ->get();

        // ✅ Marquer automatiquement les candidatures 'sent' comme 'viewed'
        $jobOffer->applications()
            ->where('status', 'sent')
            ->update(['status' => 'viewed', 'viewed_at' => now()]);

        return response()->json([
            'job_offer' => $jobOffer->load('company:id,name,logo_path'),
            'applications' => $applications,
            'stats' => [
                'total' => $applications->count(),
                'sent' => $applications->where('status', 'sent')->count(),
                'viewed' => $applications->where('status', 'viewed')->count(),
                'shortlisted' => $applications->where('status', 'shortlisted')->count(),
                'interview' => $applications->where('status', 'interview')->count(),
                'accepted' => $applications->where('status', 'accepted')->count(),
                'rejected' => $applications->where('status', 'rejected')->count(),
            ],
        ]);
    }

    /**
     * Liste des offres de l'utilisateur (recruteur)
     */
    public function my(Request $request)
    {
        $user = $request->user();
        $companyIds = $user->companies()->pluck('id');

        if ($companyIds->isEmpty()) {
            return response()->json([]);
        }

        return JobOffer::query()
            ->whereIn('company_id', $companyIds)
            ->with(['company:id,name,logo_path,city,country', 'skills'])
            ->withCount('applications')
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->when($request->offer_type, fn($q, $v) => $q->where('offer_type', $v))
            ->latest()
            ->get();
    }
}