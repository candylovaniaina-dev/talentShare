<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mission;
use App\Models\Proposal;
use App\Models\ResourceRequest;
use App\Models\ResourceOffer;
use App\Services\MatchingService;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class ProposalController extends Controller
{
    // ============================================
    // INDEX — Mes propositions (envoyées + reçues)
    // ============================================
   public function received(Request $request)
{
    try {
        $user = $request->user();
        $companyIds = $user->companies()->pluck('id')->toArray();
        $profile = $user->professionalProfile;

        $query = Proposal::query();

        // ✅ CAS 1 : Utilisateur est une ENTREPRISE
        if (!empty($companyIds)) {
            $query->where(function ($q) use ($companyIds) {
                $q->whereIn('to_company_id', $companyIds)
                  ->orWhereHas('resourceRequest', fn ($sq) => $sq->whereIn('company_id', $companyIds));
            });
        }

        // ✅ CAS 2 : Utilisateur est un TALENT (mais pas via son entreprise)
        if ($profile && empty($companyIds)) {
            // Le talent reçoit les propositions faites à SON profil
            $query->where('professional_profile_id', $profile->id);
        } elseif ($profile && !empty($companyIds)) {
            // Le talent a aussi une entreprise → on ajoute ses propositions reçues
            $query->orWhere(function ($q) use ($profile) {
                $q->where('professional_profile_id', $profile->id)
                  ->whereNull('to_company_id')
                  ->whereNull('resource_request_id');
            });
        }

        if (empty($companyIds) && !$profile) {
            return response()->json([]);
        }

        return $query
            ->with([
                'profile.user:id,name',
                'profile:id,user_id,headline,avatar_path',
                'proposingCompany:id,name,logo_path',
                'toCompany:id,name,logo_path',
                'resourceRequest:id,title,company_id',
                'resourceOffer:id,title',
                'documents:id,documentable_id,documentable_type,type,file_path,status',
            ])
            ->latest()
            ->get()
            ->map(fn ($p) => $this->appendDisplay($p));
    } catch (\Exception $e) {
        \Log::error('received() failed: ' . $e->getMessage());
        return response()->json(['error' => $e->getMessage()], 500);
    }
}
    public function sent(Request $request)
    {
        try {
            $user = $request->user();
            $companyIds = $user->companies()->pluck('id')->toArray();

            if (empty($companyIds)) {
                return response()->json([]);
            }

            return Proposal::whereIn('proposed_by_company_id', $companyIds)
                ->with([
                    'profile.user:id,name',
                    'profile:id,user_id,headline,avatar_path',
                    'toCompany:id,name,logo_path',
                    'resourceRequest:id,title,company_id',
                    'resourceOffer:id,title',
                    'documents:id,documentable_id,documentable_type,type,file_path,status',
                ])
                ->latest()
                ->get()
                ->map(fn ($p) => $this->appendDisplay($p));
        } catch (\Exception $e) {
            \Log::error('sent() failed: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ============================================
    // STORE — Création (peut être un draft)
    // ============================================
    public function store(Request $request, MatchingService $matching)
    {
        $data = $request->validate([
            'resource_request_id'       => ['nullable', 'exists:resource_requests,id'],
            'resource_offer_id'         => ['nullable', 'exists:resource_offers,id'],
            'professional_profile_id'   => ['required', 'exists:professional_profiles,id'],
            'proposed_by_company_id'    => ['required', 'exists:companies,id'],
            'to_company_id'             => ['nullable', 'exists:companies,id'],
            'message'                   => ['nullable', 'string'],
            'description'               => ['nullable', 'string'],
            'conditions'                => ['nullable', 'string'],
            'start_at'                  => ['nullable', 'date'],
            'end_at'                    => ['nullable', 'date', 'after_or_equal:start_at'],
            'workload_percent'          => ['nullable', 'integer', 'min:0', 'max:100'],
            'remote'                    => ['boolean'],
            'expires_at'                => ['nullable', 'date', 'after_or_equal:today'],
            'status'                    => ['required', 'in:draft,sent'],
        ]);

        // ✅ Vérifier que l'entreprise proposante m'appartient
        if ($request->user()->companies()->where('id', $data['proposed_by_company_id'])->doesntExist()) {
            return response()->json(['message' => 'Cette entreprise ne vous appartient pas.'], 403);
        }

        $profile = \App\Models\ProfessionalProfile::findOrFail($data['professional_profile_id']);

        // ✅ Si ResourceRequest → vérifier doublons + statut
        if (!empty($data['resource_request_id'])) {
            $resourceRequest = ResourceRequest::findOrFail($data['resource_request_id']);

            $existing = Proposal::where('resource_request_id', $resourceRequest->id)
                ->where('professional_profile_id', $profile->id)
                ->first();

            if ($existing && $data['status'] === 'sent') {
                return response()->json([
                    'message' => "Ce talent a déjà été proposé pour cette demande.",
                    'code' => 'duplicate_proposal',
                ], 409);
            }

            if ($resourceRequest->display_status !== 'published') {
                return response()->json([
                    'message' => "Cette demande n'accepte plus de propositions.",
                    'code' => 'request_closed',
                ], 409);
            }
        }

        // ✅ Score matching si ResourceRequest
        $score = null;
        if (!empty($data['resource_request_id'])) {
            $resourceRequest = ResourceRequest::findOrFail($data['resource_request_id']);
            $scoreResult = $matching->score($resourceRequest, $profile);
            $score = $scoreResult['total'];

            // ✅ Vérifier conflit mission
            $overlap = Mission::where('professional_profile_id', $profile->id)
                ->whereIn('status', ['planned', 'active'])
                ->where('start_at', '<=', $resourceRequest->end_at)
                ->where('end_at', '>=', $resourceRequest->start_at)
                ->exists();

            if ($overlap && $data['status'] === 'sent') {
                return response()->json([
                    'message' => "Ce talent a déjà une mission sur cette période.",
                    'code' => 'mission_overlap',
                ], 409);
            }
        }

        // ✅ Expiration par défaut 30 jours
        $expiresAt = $data['expires_at'] ?? now()->addDays(30)->toDateString();

        // ✅ Créer
        $proposal = Proposal::create([
            ...$data,
            'match_score' => $score,
            'expires_at' => $expiresAt,
            'sent_at' => $data['status'] === 'sent' ? now() : null,
        ]);

        // ✅ Notifier si envoyée immédiatement
        if ($proposal->status === 'sent') {
            $this->notifyRecipient($proposal);
        }

        return response()->json(
            $this->appendDisplay($proposal->load(['profile.user', 'proposingCompany', 'toCompany'])),
            201
        );
    }

    // ============================================
    // SUBMIT — Envoyer un brouillon
    // ============================================
    public function submit(Request $request, Proposal $proposal)
    {
        $this->authorizeSender($request, $proposal);

        if ($proposal->status !== 'draft') {
            return response()->json(['message' => 'Seules les propositions en brouillon peuvent être envoyées.'], 409);
        }

        $proposal->update([
            'status' => 'sent',
            'sent_at' => now(),
            'expires_at' => $proposal->expires_at ?? now()->addDays(30),
        ]);

        $this->notifyRecipient($proposal);

        return $this->appendDisplay($proposal);
    }

    // ============================================
    // CANCEL — Annuler par l'expéditeur
    // ============================================
    public function cancel(Request $request, Proposal $proposal)
    {
        $this->authorizeSender($request, $proposal);

        if (!in_array($proposal->status, ['draft', 'sent', 'viewed'])) {
            return response()->json(['message' => 'Cette proposition ne peut plus être annulée.'], 409);
        }

        $proposal->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        return $this->appendDisplay($proposal);
    }

    // ============================================
    // UPDATE
    // ============================================
    public function update(Request $request, Proposal $proposal)
    {
        $this->authorizeSender($request, $proposal);

        if ($proposal->status !== 'draft') {
            return response()->json(['message' => 'Seules les propositions en brouillon peuvent être modifiées.'], 409);
        }

        $data = $request->validate([
            'message'          => ['nullable', 'string'],
            'description'      => ['nullable', 'string'],
            'conditions'       => ['nullable', 'string'],
            'start_at'         => ['nullable', 'date'],
            'end_at'           => ['nullable', 'date', 'after_or_equal:start_at'],
            'workload_percent' => ['nullable', 'integer', 'min:0', 'max:100'],
            'remote'           => ['boolean'],
            'expires_at'       => ['nullable', 'date', 'after_or_equal:today'],
        ]);

        $proposal->update($data);

        return $this->appendDisplay($proposal);
    }

    // ============================================
    // SHOW
    // ============================================
    public function show(Request $request, Proposal $proposal)
    {
        $user = $request->user();
        $companyIds = $user->companies()->pluck('id')->toArray();
        $profile = $user->professionalProfile;

        // ✅ Marquer comme "consultée" si c'est le destinataire
        $isRecipient = in_array($proposal->to_company_id, $companyIds)
            || ($proposal->resourceRequest && in_array($proposal->resourceRequest->company_id, $companyIds));

        if ($isRecipient && $proposal->status === 'sent') {
            $proposal->update(['status' => 'viewed', 'viewed_at' => now()]);
        }

        $proposal->load([
            'resourceRequest.company',
            'resourceOffer',
            'profile.user',
            'proposingCompany',
            'toCompany',
            'documents.uploader:id,name',
            'mission',
        ]);

        return $this->appendDisplay($proposal);
    }

    // ============================================
    // ACCEPT
    // ============================================
    public function accept(Request $request, Proposal $proposal, NotificationService $notifications)
    {
        $this->authorizeRecipient($request, $proposal);

        if (!in_array($proposal->status, ['sent', 'viewed'])) {
            return response()->json(['message' => 'Cette proposition ne peut plus être acceptée.'], 409);
        }

        // ✅ Vérifier conflit mission
        if ($proposal->start_at && $proposal->end_at) {
            $overlap = Mission::where('professional_profile_id', $proposal->professional_profile_id)
                ->whereIn('status', ['planned', 'active'])
                ->where('start_at', '<=', $proposal->end_at)
                ->where('end_at', '>=', $proposal->start_at)
                ->exists();

            if ($overlap) {
                return response()->json(['message' => 'Ce talent a déjà une mission sur cette période.'], 409);
            }
        }

        $proposal->update(['status' => 'accepted', 'responded_at' => now()]);

        // ✅ Créer la mission
        $startAt = $proposal->start_at ?? $proposal->resourceRequest?->start_at ?? now();
        $endAt = $proposal->end_at ?? $proposal->resourceRequest?->end_at ?? now()->addMonth();

        $mission = Mission::create([
            'proposal_id'              => $proposal->id,
            'requesting_company_id'    => $proposal->to_company_id ?? $proposal->resourceRequest?->company_id,
            'supplying_company_id'     => $proposal->proposed_by_company_id,
            'professional_profile_id'  => $proposal->professional_profile_id,
            'resource_offer_id'        => $proposal->resource_offer_id,
            'start_at'                 => $startAt,
            'end_at'                   => $endAt,
            'workload_percent'         => $proposal->workload_percent ?? $proposal->resourceRequest?->workload_percent ?? 100,
            'remote'                   => $proposal->remote ?? $proposal->resourceRequest?->remote ?? false,
            'status'                   => 'planned',
        ]);

        // ✅ Fermer la ResourceRequest si applicable
        if ($proposal->resourceRequest) {
            $proposal->resourceRequest->update(['status' => 'closed']);
        }

        // ✅ Notifications
        try {
            if ($proposal->proposingCompany?->owner) {
                $notifications->notify(
                    $proposal->proposingCompany->owner,
                    'proposal_accepted',
                    '✅ Votre proposition a été acceptée',
                    "Mission créée pour \"{$proposal->profile->user->name}\".",
                    $mission,
                    ['mission_id' => $mission->id]
                );
            }
            if ($proposal->profile?->user) {
                $notifications->notify(
                    $proposal->profile->user,
                    'mission_pending_approval',
                    '🎯 Nouvelle mission proposée',
                    "Vous avez été accepté pour une mission.",
                    $mission,
                    ['mission_id' => $mission->id]
                );
            }
        } catch (\Exception $e) {
            \Log::warning('Notification failed: ' . $e->getMessage());
        }

        return response()->json([
            'proposal' => $this->appendDisplay($proposal),
            'mission' => $mission,
        ], 201);
    }

    // ============================================
    // DECLINE
    // ============================================
    public function decline(Request $request, Proposal $proposal, NotificationService $notifications)
    {
        $this->authorizeRecipient($request, $proposal);

        if (!in_array($proposal->status, ['sent', 'viewed'])) {
            return response()->json(['message' => 'Cette proposition ne peut plus être refusée.'], 409);
        }

        $proposal->update(['status' => 'declined', 'responded_at' => now()]);

        try {
            if ($proposal->proposingCompany?->owner) {
                $notifications->notify(
                    $proposal->proposingCompany->owner,
                    'proposal_declined',
                    '❌ Votre proposition a été refusée',
                    "La proposition pour \"{$proposal->profile->user->name}\" a été refusée.",
                    $proposal
                );
            }
        } catch (\Exception $e) {
            \Log::warning('Notification failed: ' . $e->getMessage());
        }

        return $this->appendDisplay($proposal);
    }

    // ============================================
    // HELPERS
    // ============================================
    private function appendDisplay(Proposal $p): Proposal
    {
        try {
            $p->append(['display_status', 'status_label', 'days_until_expiry', 'is_pending']);
        } catch (\Exception $e) {
            \Log::warning('appendDisplay failed: ' . $e->getMessage());
        }
        return $p;
    }

   private function notifyRecipient(Proposal $proposal): void
{
    try {
        $notifications = app(NotificationService::class);

        // ✅ CAS 1 : Proposition à une ENTREPRISE (via ResourceRequest)
        $targetCompany = $proposal->toCompany ?? $proposal->resourceRequest?->company;

        if ($targetCompany?->owner) {
            $notifications->notify(
                $targetCompany->owner,
                'proposal_received',
                '📥 Nouvelle proposition reçue',
                "{$proposal->proposingCompany->name} vous propose : {$proposal->profile->user->name}",
                $proposal,
                [
                    'proposal_id' => $proposal->id,
                    'match_score' => $proposal->match_score,
                ]
            );
        }

        // ✅ CAS 2 : Proposition DIRECTE à un TALENT
        if (!$targetCompany && $proposal->profile?->user) {
            $notifications->notify(
                $proposal->profile->user,
                'proposal_received',
                '🎯 Nouvelle opportunité !',
                "{$proposal->proposingCompany->name} souhaite vous proposer une mission.",
                $proposal,
                [
                    'proposal_id' => $proposal->id,
                    'match_score' => $proposal->match_score,
                ]
            );
        }
    } catch (\Exception $e) {
        \Log::warning('notifyRecipient failed: ' . $e->getMessage());
    }
}

    private function authorizeSender(Request $request, Proposal $proposal): void
    {
        $isSender = $request->user()->companies()
            ->where('id', $proposal->proposed_by_company_id)->exists();

        abort_unless($isSender, 403, 'Seule l\'entreprise expéditrice peut modifier cette proposition.');
    }

    private function authorizeRecipient(Request $request, Proposal $proposal): void
    {
        $user = $request->user();
        $companyIds = $user->companies()->pluck('id')->toArray();

        $isRecipientCompany = in_array($proposal->to_company_id, $companyIds)
            || ($proposal->resourceRequest && in_array($proposal->resourceRequest->company_id, $companyIds));

        $isTargetTalent = $user->professionalProfile
            && $user->professionalProfile->id === $proposal->professional_profile_id;

        abort_unless(
            $isRecipientCompany || $isTargetTalent,
            403,
            'Seule l\'entreprise destinataire ou le talent concerné peut répondre.'
        );
    }
}