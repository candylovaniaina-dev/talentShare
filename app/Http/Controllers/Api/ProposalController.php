<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mission;
use App\Models\Proposal;
use App\Models\ResourceRequest;
use App\Services\MatchingService;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Notification;
use App\Models\JobOffer;

class ProposalController extends Controller
{
    /** contract_type (ResourceRequest) considérés comme un EMPLOI (CDI + période d'essai) */
    private const JOB_CONTRACT_TYPES = ['emploi', 'job', 'cdi', 'cdd', 'first_job'];

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

            // CAS 1 : Utilisateur est une ENTREPRISE
            if (!empty($companyIds)) {
                $query->where(function ($q) use ($companyIds) {
                    $q->whereIn('to_company_id', $companyIds)
                      ->orWhereHas('resourceRequest', fn ($sq) => $sq->whereIn('company_id', $companyIds));
                });
            }

            // CAS 2 : Utilisateur est un TALENT
            if ($profile && empty($companyIds)) {
                $query->where('professional_profile_id', $profile->id);
            } elseif ($profile && !empty($companyIds)) {
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
            $profile = $user->professionalProfile;

            if (empty($companyIds) && !$profile) {
                return response()->json([]);
            }

            $query = Proposal::query();

            $query->where(function ($q) use ($companyIds, $profile) {
                if (!empty($companyIds)) {
                    $q->whereIn('proposed_by_company_id', $companyIds);
                }
                if ($profile) {
                    $q->orWhere(function ($sq) use ($profile) {
                        $sq->where('professional_profile_id', $profile->id)
                           ->whereNull('proposed_by_company_id');
                    });
                }
            });

            return $query
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
    // STORE (flux classique : le TALENT postule / une entreprise propose un talent)
    // ============================================
    public function store(Request $request, MatchingService $matching, NotificationService $notifications)
    {
        $data = $request->validate([
            'resource_request_id'     => ['nullable', 'exists:resource_requests,id'],
            'resource_offer_id'       => ['nullable', 'exists:resource_offers,id'],
            'job_offer_id'            => ['nullable', 'exists:job_offers,id'],
            'professional_profile_id' => ['required', 'exists:professional_profiles,id'],
            'proposed_by_company_id'  => ['nullable', 'exists:companies,id'],
            'to_company_id'           => ['nullable', 'exists:companies,id'],
            'message'                 => ['nullable', 'string'],
            'description'             => ['nullable', 'string'],
            'conditions'              => ['nullable', 'string'],
            'start_at'                => ['nullable', 'date'],
            'end_at'                  => ['nullable', 'date', 'after_or_equal:start_at'],
            'workload_percent'        => ['nullable', 'integer', 'min:0', 'max:100'],
            'remote'                  => ['boolean'],
            'expires_at'              => ['nullable', 'date', 'after_or_equal:today'],
            'status'                  => ['required', 'in:draft,sent'],
        ]);

        if (!empty($data['proposed_by_company_id'])) {
            if ($request->user()->companies()->where('id', $data['proposed_by_company_id'])->doesntExist()) {
                return response()->json(['message' => 'Cette entreprise ne vous appartient pas.'], 403);
            }
        } else {
            $userProfile = $request->user()->professionalProfile;
            if (!$userProfile || $userProfile->id !== (int) $data['professional_profile_id']) {
                return response()->json(['message' => 'Vous ne pouvez proposer que votre propre profil.'], 403);
            }
        }

        $profile = \App\Models\ProfessionalProfile::findOrFail($data['professional_profile_id']);

        // GESTION DES DEMANDES DE RESSOURCES
        if (!empty($data['resource_request_id'])) {
            $resourceRequest = ResourceRequest::findOrFail($data['resource_request_id']);

            $existing = Proposal::where('resource_request_id', $resourceRequest->id)
                ->where('professional_profile_id', $profile->id)
                ->first();

            if ($existing && $data['status'] === 'sent') {
                return response()->json(['message' => "Ce talent a déjà été proposé pour cette demande.", 'code' => 'duplicate_proposal'], 409);
            }

            if ($resourceRequest->display_status !== 'published') {
                return response()->json(['message' => "Cette demande n'accepte plus de propositions.", 'code' => 'request_closed'], 409);
            }

            if (empty($data['to_company_id']) && $resourceRequest->company_id) {
                $data['to_company_id'] = $resourceRequest->company_id;
            }
        }

        // GESTION DES OFFRES D'EMPLOI (JobOffer)
        if (!empty($data['job_offer_id'])) {
            $jobOffer = JobOffer::findOrFail($data['job_offer_id']);

            $existing = Proposal::where('job_offer_id', $jobOffer->id)
                ->where('professional_profile_id', $profile->id)
                ->first();

            if ($existing && $data['status'] === 'sent') {
                return response()->json(['message' => "Vous avez déjà postulé à cette offre.", 'code' => 'duplicate_proposal'], 409);
            }

            if (empty($data['to_company_id']) && $jobOffer->company_id) {
                $data['to_company_id'] = $jobOffer->company_id;
            }
        }

        // Score matching (seulement pour resource_request)
        $score = null;
        if (!empty($data['resource_request_id'])) {
            $resourceRequest = ResourceRequest::findOrFail($data['resource_request_id']);
            $scoreResult = $matching->score($resourceRequest, $profile);
            $score = $scoreResult['total'];

            $overlap = Mission::where('professional_profile_id', $profile->id)
                ->whereIn('status', ['planned', 'active'])
                ->where('start_at', '<=', $resourceRequest->end_at)
                ->where('end_at', '>=', $resourceRequest->start_at)
                ->exists();

            if ($overlap && $data['status'] === 'sent') {
                return response()->json(['message' => "Ce talent a déjà une mission sur cette période.", 'code' => 'mission_overlap'], 409);
            }
        }

        $expiresAt = $data['expires_at'] ?? now()->addDays(30)->toDateString();

        $proposal = Proposal::create([
            ...$data,
            'match_score' => $score,
            'expires_at' => $expiresAt,
            'sent_at' => $data['status'] === 'sent' ? now() : null,
            'proposed_by_company_id' => $data['proposed_by_company_id'] ?? null,
        ]);

        if ($proposal->status === 'sent') {
            $this->notifyRecipient($proposal);

            if (empty($data['proposed_by_company_id'])) {
                try {
                    $title = !empty($data['job_offer_id'])
                        ? "Candidature envoyée à l'offre"
                        : "Candidature envoyée à la demande";

                    $subjectTitle = $jobOffer->title ?? $resourceRequest?->title ?? "une publication";

                    Notification::create([
                        'user_id' => $request->user()->id,
                        'type' => 'new_application',
                        'title' => $title,
                        'body' => "Vous avez postulé à « {$subjectTitle} »",
                        'subject_type' => !empty($data['job_offer_id']) ? JobOffer::class : ResourceRequest::class,
                        'subject_id' => $data['job_offer_id'] ?? $data['resource_request_id'],
                        'data' => [
                            'url' => "/proposals/{$proposal->id}",
                            'proposal_id' => $proposal->id,
                            'actor_id' => $request->user()->id,
                        ],
                    ]);
                } catch (\Exception $e) {
                    \Log::warning('Erreur notif candidature: ' . $e->getMessage());
                }
            }
        }

        $relations = ['profile.user', 'proposingCompany', 'toCompany'];
        if (!empty($data['job_offer_id'])) {
            $relations[] = 'jobOffer';
        }
        if (!empty($data['resource_request_id'])) {
            $relations[] = 'resourceRequest';
        }

        return response()->json(
            $this->appendDisplay($proposal->load($relations)),
            201
        );
    }

    // ============================================
    // SUBMIT
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
    // CANCEL
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

        $isRecipient = in_array($proposal->to_company_id, $companyIds)
            || ($proposal->resourceRequest && in_array($proposal->resourceRequest->company_id, $companyIds));

        // ✅ Flux inversé : le destinataire est le TALENT (pas une entreprise)
        $isTargetTalent = $user->professionalProfile
            && $user->professionalProfile->id === $proposal->professional_profile_id
            && !empty($proposal->proposed_by_company_id)
            && !in_array($proposal->proposed_by_company_id, $companyIds);

        if (($isRecipient || $isTargetTalent) && $proposal->status === 'sent') {
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

        $resourceRequest = $proposal->resourceRequest;

        // =====================================================
        // ✅ FLUX INVERSÉ : le talent accepte → ENTRETIEN (pas de mission tout de suite)
        // =====================================================
        if ($this->isReverseFlow($proposal)) {
            $proposal->update([
                'status'           => 'accepted',
                'responded_at'     => now(),
                'interview_status' => 'pending',
                'contract_kind'    => $proposal->contract_kind ?? $this->resolveContractKind($resourceRequest),
            ]);

            try {
                $owner = $proposal->proposingCompany?->owner;
                if ($owner) {
                    $talentName = $proposal->profile?->user?->name ?? 'Le talent';
                    $notifications->notify(
                        $owner,
                        'proposal_accepted',
                        '✅ Proposition acceptée !',
                        "{$talentName} a accepté votre proposition. Planifiez maintenant l'entretien.",
                        $proposal,
                        ['url' => "/proposals/{$proposal->id}", 'proposal_id' => $proposal->id]
                    );
                }
            } catch (\Exception $e) {
                \Log::warning('Notification failed: ' . $e->getMessage());
            }

            return response()->json([
                'proposal' => $this->appendDisplay($proposal),
                'mission'  => null,
            ]);
        }

        // =====================================================
        // FLUX CLASSIQUE (inchangé)
        // =====================================================
        $proposal->update(['status' => 'accepted', 'responded_at' => now()]);

        $jobType = $resourceRequest?->type ?? 'job';

        $startAt = $proposal->start_at ?? $resourceRequest?->start_at ?? now();
        $endAt = $proposal->end_at ?? $resourceRequest?->end_at ?? now()->addMonth();

        $isInternship = in_array($jobType, ['internship', 'stage']);
        $initialStatus = $isInternship ? 'planned' : 'pending_employee';

        $mission = Mission::create([
            'proposal_id'             => $proposal->id,
            // ✅ FIX : "proposing_company_id" n'existe pas → on utilise l'entreprise destinataire
            'requesting_company_id'   => $proposal->to_company_id ?? $resourceRequest?->company_id,
            'supplying_company_id'    => null,
            'professional_profile_id' => $proposal->professional_profile_id,
            'start_at'                => $startAt,
            'end_at'                  => $isInternship ? $endAt : now()->addMonth(),
            'workload_percent'        => 100,
            'remote'                  => false,
            'status'                  => $initialStatus,
        ]);

        if ($resourceRequest) {
            $resourceRequest->update(['status' => 'closed']);
        }

        try {
            $talent = $proposal->profile->user;
            $notifications->notify(
                $talent,
                'proposal_accepted',
                '✅ Proposition acceptée !',
                $isInternship
                    ? "Votre entretien pour le stage est validé. Consultez votre mission."
                    : "Votre période d'essai d'1 mois commence. Bon courage !",
                $mission,
                ['url' => "/missions/{$mission->id}", 'mission_id' => $mission->id]
            );
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
                    $proposal,
                    ['url' => "/proposals/{$proposal->id}", 'proposal_id' => $proposal->id]
                );
            }
        } catch (\Exception $e) {
            \Log::warning('Notification failed: ' . $e->getMessage());
        }

        return $this->appendDisplay($proposal);
    }

    // ============================================================
    // ✅ FLUX INVERSÉ — ENTRETIEN (côté recruteur)
    // ============================================================

    /** Le recruteur planifie (ou replanifie) l'entretien physique */
    public function scheduleInterview(Request $request, Proposal $proposal, NotificationService $notifications)
    {
        $this->authorizeCompanySender($request, $proposal);

        if ($proposal->status !== 'accepted'
            || !in_array($proposal->interview_status ?? 'pending', ['pending', 'scheduled'])) {
            return response()->json(['message' => "L'entretien ne peut plus être planifié pour cette proposition."], 409);
        }

        $data = $request->validate([
            'interview_at'       => ['required', 'date', 'after:now'],
            'interview_location' => ['required', 'string', 'max:255'],
            'interview_notes'    => ['nullable', 'string', 'max:2000'],
        ]);

        $proposal->update([...$data, 'interview_status' => 'scheduled']);

        try {
            $talent = $proposal->profile?->user;
            if ($talent) {
                $when = Carbon::parse($data['interview_at'])->format('d/m/Y à H:i');
                $notifications->notify(
                    $talent,
                    'interview_scheduled',
                    '📅 Entretien planifié',
                    "{$proposal->proposingCompany?->name} vous convie à un entretien le {$when} ({$data['interview_location']}).",
                    $proposal,
                    ['url' => "/proposals/{$proposal->id}", 'proposal_id' => $proposal->id]
                );
            }
        } catch (\Exception $e) {
            \Log::warning('Notification failed: ' . $e->getMessage());
        }

        return $this->appendDisplay($proposal);
    }

    /** Entretien concluant → création de la MISSION (stage = planned / emploi = trial puis CDI) */
    public function validateInterview(Request $request, Proposal $proposal, NotificationService $notifications)
    {
        $this->authorizeCompanySender($request, $proposal);

        if ($proposal->status !== 'accepted' || $proposal->interview_status !== 'scheduled') {
            return response()->json(['message' => "L'entretien doit d'abord être planifié."], 409);
        }

        if (Mission::where('proposal_id', $proposal->id)->exists()) {
            return response()->json(['message' => 'Une mission existe déjà pour cette proposition.'], 409);
        }

        $resourceRequest = $proposal->resourceRequest;
        $kind = $proposal->contract_kind ?? $this->resolveContractKind($resourceRequest);
        $isJob = $kind === 'job';

        $startAt = Carbon::parse($proposal->start_at ?? $resourceRequest?->start_at ?? now());

        $mission = DB::transaction(function () use ($proposal, $resourceRequest, $isJob, $startAt) {
            $mission = Mission::create([
                'proposal_id'             => $proposal->id,
                'requesting_company_id'   => $proposal->proposed_by_company_id,
                'supplying_company_id'    => null,
                'professional_profile_id' => $proposal->professional_profile_id,
                'start_at'                => $startAt,
                // Stage : date de fin. Emploi : CDI = pas de date de fin
                'end_at'                  => $isJob
                    ? null
                    : ($proposal->end_at ?? $resourceRequest?->end_at ?? $startAt->copy()->addMonths(3)),
                'workload_percent'        => $proposal->workload_percent ?? 100,
                'remote'                  => (bool) ($proposal->remote ?? false),
                // Stage : mission planifiée. Emploi : période d'essai (1 mois) puis validation → CDI
                'status'                  => $isJob ? 'trial' : 'planned',
                'is_trial'                => $isJob,
                'trial_ends_at'           => $isJob ? $startAt->copy()->addMonth()->toDateString() : null,
            ]);

            $proposal->update([
                'interview_status'       => 'validated',
                'interview_validated_at' => now(),
            ]);

            $resourceRequest?->update(['status' => 'closed']);

            return $mission;
        });

        try {
            $talent = $proposal->profile?->user;
            if ($talent) {
                $notifications->notify(
                    $talent,
                    'mission_created',
                    $isJob ? '🎉 Entretien validé — période d\'essai' : '🎉 Entretien validé — stage confirmé',
                    $isJob
                        ? "Votre entretien est validé. Votre période d'essai d'1 mois commence."
                        : "Votre entretien est validé. Votre mission de stage est créée.",
                    $mission,
                    ['url' => "/missions/{$mission->id}", 'mission_id' => $mission->id]
                );
            }
        } catch (\Exception $e) {
            \Log::warning('Notification failed: ' . $e->getMessage());
        }

        return response()->json([
            'proposal' => $this->appendDisplay($proposal->fresh()),
            'mission'  => $mission,
        ], 201);
    }

    /** Entretien non concluant */
    public function rejectInterview(Request $request, Proposal $proposal, NotificationService $notifications)
    {
        $this->authorizeCompanySender($request, $proposal);

        if ($proposal->status !== 'accepted'
            || !in_array($proposal->interview_status ?? 'pending', ['pending', 'scheduled'])) {
            return response()->json(['message' => 'Action impossible à ce stade.'], 409);
        }

        $proposal->update(['interview_status' => 'failed']);

        try {
            $talent = $proposal->profile?->user;
            if ($talent) {
                $notifications->notify(
                    $talent,
                    'interview_failed',
                    'Entretien non concluant',
                    "{$proposal->proposingCompany?->name} n'a pas donné suite après l'entretien.",
                    $proposal,
                    ['url' => "/proposals/{$proposal->id}", 'proposal_id' => $proposal->id]
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

    /** Flux inversé = proposition faite par une entreprise sur la demande d'un talent */
    private function isReverseFlow(Proposal $proposal): bool
    {
        return !empty($proposal->proposed_by_company_id)
            && $proposal->resourceRequest?->author_type === 'talent';
    }

    /** 'job' (emploi → CDI avec essai) ou 'internship' (stage / alternance / mission : date de fin) */
    private function resolveContractKind(?ResourceRequest $request): string
    {
        $type = strtolower((string) ($request?->contract_type ?? ''));
        return in_array($type, self::JOB_CONTRACT_TYPES, true) ? 'job' : 'internship';
    }

    /**
     * ✅ Notifie le destinataire d'une proposition
     */
    private function notifyRecipient(Proposal $proposal): void
    {
        try {
            $notifications = app(NotificationService::class);

            $targetCompany = $proposal->toCompany ?? $proposal->resourceRequest?->company;
            $ownerId = $targetCompany?->owner_user_id;

            $isTalentProposal = empty($proposal->proposed_by_company_id);

            if ($isTalentProposal) {
                $authorName = $proposal->profile?->user?->name ?? 'Un talent';
                $bodyText = "{$authorName} a postulé à votre demande";
            } else {
                $authorName = $proposal->proposingCompany?->name ?? 'Une entreprise';
                $candidateName = $proposal->profile?->user?->name ?? 'un talent';
                $bodyText = "{$authorName} vous propose : {$candidateName}";
            }

            if ($ownerId) {
                $owner = \App\Models\User::find($ownerId);
                if ($owner) {
                    $notifications->notify(
                        $owner,
                        'proposal_received',
                        '📥 Nouvelle proposition reçue',
                        $bodyText,
                        $proposal,
                        [
                            'url' => "/proposals/{$proposal->id}",
                            'proposal_id' => $proposal->id,
                            'match_score' => $proposal->match_score,
                        ]
                    );
                    \Log::info("✅ Notif proposal_received → user #{$ownerId} (proposal #{$proposal->id})");
                }
            }

            if (!$targetCompany && $proposal->profile?->user) {
                $notifications->notify(
                    $proposal->profile->user,
                    'proposal_received',
                    '🎯 Nouvelle opportunité !',
                    "{$authorName} souhaite vous proposer une mission.",
                    $proposal,
                    [
                        'url' => "/proposals/{$proposal->id}",
                        'proposal_id' => $proposal->id,
                        'match_score' => $proposal->match_score,
                    ]
                );
            }
        } catch (\Exception $e) {
            \Log::error('notifyRecipient failed: ' . $e->getMessage());
        }
    }

    /**
     * ✅ Compte les nouvelles propositions depuis la dernière visite
     */
    public function countNew(Request $request)
    {
        try {
            $user = $request->user();
            $companyIds = $user->companies()->pluck('id')->toArray();
            $profile = $user->professionalProfile;

            if (empty($companyIds) && !$profile) {
                return response()->json(['count' => 0]);
            }

            $since = $user->proposals_last_seen_at;

            $query = Proposal::query();

            if (!empty($companyIds)) {
                $query->where(function ($q) use ($companyIds) {
                    $q->whereIn('to_company_id', $companyIds)
                      ->orWhereHas('resourceRequest', fn ($sq) => $sq->whereIn('company_id', $companyIds));
                });
            }

            if ($profile && empty($companyIds)) {
                $query->where('professional_profile_id', $profile->id);
            }

            $query->whereIn('status', ['sent', 'viewed']);

            if ($since) {
                $query->where('created_at', '>', $since);
            } else {
                $query->where('created_at', '>', now()->subDays(30));
            }

            return response()->json(['count' => $query->count()]);
        } catch (\Exception $e) {
            \Log::error('countNew() failed: ' . $e->getMessage());
            return response()->json(['count' => 0]);
        }
    }

    /**
     * ✅ Marque les propositions comme vues
     */
    public function markSeen(Request $request)
    {
        $request->user()?->update([
            'proposals_last_seen_at' => now(),
        ]);

        return response()->json(['success' => true]);
    }

    private function authorizeSender(Request $request, Proposal $proposal): void
    {
        $isSender = $request->user()->companies()
            ->where('id', $proposal->proposed_by_company_id)->exists();

        $isTalentAuthor = $request->user()->professionalProfile
            && $request->user()->professionalProfile->id === $proposal->professional_profile_id
            && empty($proposal->proposed_by_company_id);

        abort_unless($isSender || $isTalentAuthor, 403, 'Vous n\'êtes pas autorisé à modifier cette proposition.');
    }

    /** ✅ Seule l'entreprise qui a envoyé la proposition (flux inversé) */
    private function authorizeCompanySender(Request $request, Proposal $proposal): void
    {
        $isSenderCompany = !empty($proposal->proposed_by_company_id)
            && $request->user()->companies()->where('id', $proposal->proposed_by_company_id)->exists();

        abort_unless(
            $isSenderCompany && $this->isReverseFlow($proposal),
            403,
            'Seule l\'entreprise qui a envoyé la proposition peut gérer l\'entretien.'
        );
    }

    private function authorizeRecipient(Request $request, Proposal $proposal): void
    {
        $user = $request->user();
        $companyIds = $user->companies()->pluck('id')->toArray();

        // ✅ L'expéditeur ne peut jamais répondre à sa propre proposition
        if (!empty($proposal->proposed_by_company_id) && in_array($proposal->proposed_by_company_id, $companyIds)) {
            abort(403, 'Vous ne pouvez pas répondre à votre propre proposition.');
        }

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

    // ============================================
    // ✅ FLUX INVERSÉ : le RECRUTEUR propose une offre à un TALENT
    // ============================================
    public function recruiterApply(Request $request, NotificationService $notifications)
    {
        // Le profil du talent est déduit de l'AUTEUR de la demande (on ignore tout professional_profile_id envoyé)
        $data = $request->validate([
            'resource_request_id'    => ['required', 'exists:resource_requests,id'],
            'proposed_by_company_id' => ['required', 'exists:companies,id'],
            'message'                => ['required', 'string', 'min:20'],
            'conditions'             => ['nullable', 'string'],
            'start_at'               => ['nullable', 'date'],
            'end_at'                 => ['nullable', 'date', 'after_or_equal:start_at'],
            'status'                 => ['required', 'in:sent'],
        ]);

        // 1. L'entreprise appartient au recruteur
        if ($request->user()->companies()->where('id', $data['proposed_by_company_id'])->doesntExist()) {
            return response()->json(['message' => 'Cette entreprise ne vous appartient pas.'], 403);
        }

        // 2. La demande doit avoir été publiée par un talent
        $resourceRequest = ResourceRequest::with('author.professionalProfile')->findOrFail($data['resource_request_id']);

        if ($resourceRequest->author_type !== 'talent') {
            return response()->json(['message' => 'Cette demande a été publiée par une entreprise. Utilisez le flux classique.'], 409);
        }

        if ($resourceRequest->display_status !== 'published') {
            return response()->json(['message' => "Cette demande n'accepte plus de propositions.", 'code' => 'request_closed'], 409);
        }

        if ($resourceRequest->author?->id === $request->user()->id) {
            return response()->json(['message' => 'Vous ne pouvez pas répondre à votre propre demande.'], 403);
        }

        // 3. Le vrai profil du talent
        $talentProfile = $resourceRequest->author?->professionalProfile;
        if (!$talentProfile) {
            return response()->json(['message' => "L'auteur de cette demande n'a pas de profil professionnel."], 422);
        }

        // 4. Pas de doublon actif pour la même entreprise
        $duplicate = Proposal::where('resource_request_id', $resourceRequest->id)
            ->where('proposed_by_company_id', $data['proposed_by_company_id'])
            ->whereNotIn('status', ['cancelled', 'declined', 'expired'])
            ->exists();

        if ($duplicate) {
            return response()->json(['message' => 'Votre entreprise a déjà envoyé une proposition pour cette demande.', 'code' => 'duplicate_proposal'], 409);
        }

        // 5. Création
        $proposal = Proposal::create([
            'resource_request_id'     => $resourceRequest->id,
            'professional_profile_id' => $talentProfile->id,
            'proposed_by_company_id'  => $data['proposed_by_company_id'],
            'to_company_id'           => null,
            'message'                 => $data['message'],
            'conditions'              => $data['conditions'] ?? null,
            'start_at'                => $data['start_at'] ?? null,
            'end_at'                  => $data['end_at'] ?? null,
            'status'                  => 'sent',
            'sent_at'                 => now(),
            'expires_at'              => now()->addDays(30),
            'contract_kind'           => $this->resolveContractKind($resourceRequest),
        ]);

        // 6. Notifier le talent
        try {
            if ($resourceRequest->author) {
                $companyName = $proposal->proposingCompany?->name ?? 'Une entreprise';
                $notifications->notify(
                    $resourceRequest->author,
                    'proposal_received',
                    '📩 Nouvelle proposition de recruteur',
                    "{$companyName} vous fait une proposition pour votre demande : {$resourceRequest->title}.",
                    $proposal,
                    ['url' => "/proposals/{$proposal->id}", 'proposal_id' => $proposal->id]
                );
            }
        } catch (\Exception $e) {
            \Log::warning('Erreur notif recruteur: ' . $e->getMessage());
        }

        return response()->json(
            $this->appendDisplay($proposal->load(['profile.user', 'proposingCompany', 'resourceRequest'])),
            201
        );
    }
}