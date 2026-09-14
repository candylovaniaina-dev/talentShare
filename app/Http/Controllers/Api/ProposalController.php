<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mission;
use App\Models\Proposal;
use App\Models\ResourceRequest;
use App\Services\MatchingService;
use Illuminate\Http\Request;
use App\Services\NotificationService;

class ProposalController extends Controller
{
    public function store(Request $request, MatchingService $matching)
    {
        $data = $request->validate([
            'resource_request_id' => ['required', 'exists:resource_requests,id'],
            'professional_profile_id' => ['required', 'exists:professional_profiles,id'],
            'proposed_by_company_id' => ['required', 'exists:companies,id'],
            'message' => ['nullable', 'string'],
        ]);

        if ($request->user()->companies()->where('id', $data['proposed_by_company_id'])->doesntExist()) {
            return response()->json(['message' => 'Cette entreprise ne vous appartient pas.'], 403);
        }

        $resourceRequest = ResourceRequest::findOrFail($data['resource_request_id']);
        $profile = \App\Models\ProfessionalProfile::findOrFail($data['professional_profile_id']);
        $score = $matching->score($resourceRequest, $profile);

        $proposal = Proposal::create([
            ...$data,
            'match_score' => $score['total'],
            'status' => 'sent',
            'sent_at' => now(),
        ]);

        return response()->json($proposal, 201);
    }

    public function show(Request $request, Proposal $proposal)
    {
        $proposal->load(['resourceRequest.company', 'profile.user', 'proposingCompany']);

        // Marque comme "consultée" si c'est la société destinataire (celle qui a publié la demande) qui regarde
        $isRecipient = $request->user()->companies()
            ->where('id', $proposal->resourceRequest->company_id)->exists();

        if ($isRecipient && $proposal->status === 'sent') {
            $proposal->update(['status' => 'viewed', 'viewed_at' => now()]);
        }

        return $proposal;
    }

public function accept(Request $request, Proposal $proposal, \App\Services\NotificationService $notifications)
{
    $this->authorizeRecipient($request, $proposal);

    if (! in_array($proposal->status, ['sent', 'viewed'])) {
        return response()->json(['message' => 'Cette proposition ne peut plus être acceptée.'], 409);
    }

    $resourceRequest = $proposal->resourceRequest;
    $overlap = Mission::where('professional_profile_id', $proposal->professional_profile_id)
        ->whereIn('status', ['planned', 'active'])
        ->where('start_at', '<=', $resourceRequest->end_at)
        ->where('end_at', '>=', $resourceRequest->start_at)
        ->exists();

    if ($overlap) {
        return response()->json(['message' => 'Ce talent a déjà une mission sur cette période.'], 409);
    }

    $proposal->update(['status' => 'accepted', 'responded_at' => now()]);

    $mission = Mission::create([
        'proposal_id' => $proposal->id,
        'requesting_company_id' => $resourceRequest->company_id,
        'supplying_company_id' => $proposal->proposed_by_company_id,
        'professional_profile_id' => $proposal->professional_profile_id,
        'start_at' => $resourceRequest->start_at,
        'end_at' => $resourceRequest->end_at,
        'workload_percent' => $resourceRequest->workload_percent,
        'remote' => $resourceRequest->remote,
        'status' => 'planned',
    ]);

    $resourceRequest->update(['status' => 'closed']);

    $notifications->notify(
        $proposal->proposingCompany->owner,
        'proposal_accepted',
        'Votre proposition a été acceptée',
        "Mission créée pour \"{$resourceRequest->title}\".",
        $mission
    );

    return response()->json(['proposal' => $proposal, 'mission' => $mission], 201);
}

    public function decline(Request $request, Proposal $proposal)
    {
        $this->authorizeRecipient($request, $proposal);

        if (! in_array($proposal->status, ['sent', 'viewed'])) {
            return response()->json(['message' => 'Cette proposition ne peut plus être refusée.'], 409);
        }

        $proposal->update(['status' => 'declined', 'responded_at' => now()]);

        return $proposal;
    }

    private function authorizeRecipient(Request $request, Proposal $proposal): void
    {
        $isRecipient = $request->user()->companies()
            ->where('id', $proposal->resourceRequest->company_id)->exists();

        abort_unless($isRecipient, 403, 'Seule l\'entreprise destinataire peut répondre à cette proposition.');
    }
}