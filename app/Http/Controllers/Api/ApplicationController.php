<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Application\ApplicationRequest;
use App\Models\Application;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    public function index(Request $request)
    {
        $profile = $request->user()->professionalProfile;

        if (! $profile) {
            return response()->json([]);
        }

        return $profile->applications()->with('jobOffer.company')->latest()->get();
    }

    public function store(ApplicationRequest $request)
    {
        $profile = $request->user()->professionalProfile;

        if (! $profile) {
            return response()->json(['message' => 'Créez d\'abord votre profil professionnel.'], 422);
        }

        $data = $request->validated();
        $data['professional_profile_id'] = $profile->id;
        $data['status'] = 'sent';

        if ($data['portfolio_id'] ?? null) {
            if ($profile->portfolio?->id !== (int) $data['portfolio_id']) {
                return response()->json(['message' => 'Ce portfolio ne vous appartient pas.'], 403);
            }
        }

        $application = Application::create($data);

        return response()->json($application, 201);
    }

    public function updateStatus(Request $request, Application $application)
    {
        $isOwnerCompany = $request->user()->companies()
            ->where('id', $application->jobOffer->company_id)->exists();

        abort_unless($isOwnerCompany, 403, 'Non autorisé.');

        $data = $request->validate([
            'status' => ['required', 'in:viewed,shortlisted,interview,accepted,rejected'],
        ]);

        $application->update($data);

        return $application;
    }
}