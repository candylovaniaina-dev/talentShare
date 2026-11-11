<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mission;
use App\Models\Proposal;
use App\Models\ResourceRequest;
use App\Models\ResourceOffer;
use App\Models\Conversation;
use App\Models\Message;
use App\Services\MatchingService;
use App\Services\NotificationService;
use App\Services\ContractService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Notification;
use App\Models\JobOffer;

class ProposalController extends Controller
{
    public function received(Request $request)
    {
        try {
            $user = $request->user();
            $companyIds = $user->companies()->pluck('id')->toArray();
            $profile = $user->professionalProfile;

            $query = Proposal::query()->where('status', '!=', 'draft');

            if (!empty($companyIds)) {
                $query->where(function ($q) use ($companyIds) {
                    $q->whereIn('to_company_id', $companyIds)
                      ->orWhereHas('resourceRequest', fn ($sq) => $sq->whereIn('company_id', $companyIds));
                });
            }

            if ($profile && empty($companyIds)) {
                $query->where('professional_profile_id', $profile->id);
            } elseif ($profile && !empty($companyIds)) {
                $query->orWhere(function ($q) use ($profile) {
                    $q->where('professional_profile_id', $profile->id)
                      ->whereNull('to_company_id')
                      ->whereNull('resource_request_id');
                });
            }

            if (empty($companyIds) && !$profile) return response()->json([]);

            return $query->with([
                    'profile.user:id,name', 'profile:id,user_id,headline,avatar_path',
                    'proposingCompany:id,name,logo_path', 'toCompany:id,name,logo_path',
                    'resourceRequest:id,title,company_id', 'resourceOffer:id,title',
                    'documents:id,documentable_id,documentable_type,type,file_path,status',
                ])->latest()->get()->map(fn ($p) => $this->appendDisplay($p));
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

            if (empty($companyIds) && !$profile) return response()->json([]);

            $query = Proposal::query();
            $query->where(function ($q) use ($companyIds, $profile) {
                if (!empty($companyIds)) $q->whereIn('proposed_by_company_id', $companyIds);
                if ($profile) {
                    $q->orWhere(function ($sq) use ($profile) {
                        $sq->where('professional_profile_id', $profile->id)->whereNull('proposed_by_company_id');
                    });
                }
            });

            return $query->with([
                    'profile.user:id,name', 'profile:id,user_id,headline,avatar_path',
                    'toCompany:id,name,logo_path', 'resourceRequest:id,title,company_id',
                    'resourceOffer:id,title', 'documents:id,documentable_id,documentable_type,type,file_path,status',
                ])->latest()->get()->map(fn ($p) => $this->appendDisplay($p));
        } catch (\Exception $e) {
            \Log::error('sent() failed: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

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
            $company = $request->user()->companies()->where('companies.id', $data['proposed_by_company_id'])->first();
            if (!$company) return response()->json(['message' => 'Cette entreprise ne vous appartient pas.'], 403);

            $target = \App\Models\ProfessionalProfile::findOrFail($data['professional_profile_id']);
            if (!$company->employees()->where('user_id', $target->user_id)->exists()) {
                return response()->json(['message' => "Ce talent n'est pas un salarié de cette entreprise."], 422);
            }
            if (!empty($data['to_company_id']) && (int) $data['to_company_id'] === (int) $company->id) {
                return response()->json(['message' => 'Vous ne pouvez pas vous proposer à vous-même.'], 403);
            }
        } else {
            $userProfile = $request->user()->professionalProfile;
            if (!$userProfile || (int) $userProfile->id !== (int) $data['professional_profile_id']) {
                return response()->json(['message' => 'Vous ne pouvez proposer que votre propre profil.'], 403);
            }
        }

        $profile = \App\Models\ProfessionalProfile::findOrFail($data['professional_profile_id']);
        $resourceRequest = null; $jobOffer = null;

        if (!empty($data['resource_request_id'])) {
            $resourceRequest = ResourceRequest::findOrFail($data['resource_request_id']);
            $existing = Proposal::where('resource_request_id', $resourceRequest->id)->where('professional_profile_id', $profile->id)->first();
            if ($existing && $data['status'] === 'sent') return response()->json(['message' => 'Ce talent a déjà été proposé pour cette demande.', 'code' => 'duplicate_proposal'], 409);
            if ($resourceRequest->display_status !== 'published') return response()->json(['message' => "Cette demande n'accepte plus de propositions.", 'code' => 'request_closed'], 409);
            if (empty($data['to_company_id']) && $resourceRequest->company_id) $data['to_company_id'] = $resourceRequest->company_id;
        }

        if (!empty($data['job_offer_id'])) {
            $jobOffer = JobOffer::findOrFail($data['job_offer_id']);
            $existing = Proposal::where('job_offer_id', $jobOffer->id)->where('professional_profile_id', $profile->id)->first();
            if ($existing && $data['status'] === 'sent') return response()->json(['message' => 'Vous avez déjà postulé à cette offre.', 'code' => 'duplicate_proposal'], 409);
            if (empty($data['to_company_id']) && $jobOffer->company_id) $data['to_company_id'] = $jobOffer->company_id;
        }

        $score = null;
        if (!empty($data['resource_request_id'])) {
            $scoreResult = $matching->score($resourceRequest, $profile);
            $score = $scoreResult['total'];
            $overlap = Mission::where('professional_profile_id', $profile->id)->whereIn('status', ['planned', 'active'])
                ->where('start_at', '<=', $resourceRequest->end_at)->where('end_at', '>=', $resourceRequest->start_at)->exists();
            if ($overlap && $data['status'] === 'sent') return response()->json(['message' => 'Ce talent a déjà une mission sur cette période.', 'code' => 'mission_overlap'], 409);
        }

        $expiresAt = $data['expires_at'] ?? now()->addDays(30)->toDateString();
        $proposal = Proposal::create([
            ...$data, 'match_score' => $score, 'expires_at' => $expiresAt,
            'sent_at' => $data['status'] === 'sent' ? now() : null,
            'proposed_by_company_id' => $data['proposed_by_company_id'] ?? null,
        ]);

        if ($proposal->status === 'sent') {
            $this->notifyRecipient($proposal);
            if (empty($data['proposed_by_company_id'])) {
                try {
                    $title = !empty($data['job_offer_id']) ? 'Candidature envoyée à l’offre' : 'Candidature envoyée à la demande';
                    $subjectTitle = $jobOffer->title ?? $resourceRequest?->title ?? 'une publication';
                    Notification::create([
                        'user_id' => $request->user()->id, 'type' => 'new_application', 'title' => $title,
                        'body' => "Vous avez postulé à « {$subjectTitle} »",
                        'subject_type' => !empty($data['job_offer_id']) ? JobOffer::class : ResourceRequest::class,
                        'subject_id' => $data['job_offer_id'] ?? $data['resource_request_id'],
                        'data' => ['url' => "/proposals/{$proposal->id}", 'proposal_id' => $proposal->id, 'actor_id' => $request->user()->id],
                    ]);
                } catch (\Exception $e) { \Log::warning('Erreur notif candidature: ' . $e->getMessage()); }
            }
        }

        $relations = ['profile.user', 'proposingCompany', 'toCompany'];
        if (!empty($data['job_offer_id'])) $relations[] = 'jobOffer';
        if (!empty($data['resource_request_id'])) $relations[] = 'resourceRequest';

        return response()->json($this->appendDisplay($proposal->load($relations)), 201);
    }

    public function submit(Request $request, Proposal $proposal)
    {
        $this->authorizeSender($request, $proposal);
        if ($proposal->resource_offer_id) return app(CompanyProposalController::class)->submitOffer($request, $proposal);
        if ($proposal->status !== 'draft') return response()->json(['message' => 'Seules les propositions en brouillon peuvent être envoyées.'], 409);
        $proposal->update(['status' => 'sent', 'sent_at' => now(), 'expires_at' => $proposal->expires_at ?? now()->addDays(30)]);
        $this->notifyRecipient($proposal);
        return $this->appendDisplay($proposal);
    }

    public function cancel(Request $request, Proposal $proposal)
    {
        $this->authorizeSender($request, $proposal);
        if (!in_array($proposal->status, ['draft', 'sent', 'viewed'])) return response()->json(['message' => 'Cette proposition ne peut plus être annulée.'], 409);
        $proposal->update(['status' => 'cancelled', 'cancelled_at' => now()]);
        return $this->appendDisplay($proposal);
    }

    public function update(Request $request, Proposal $proposal)
    {
        $this->authorizeSender($request, $proposal);
        if ($proposal->status !== 'draft') return response()->json(['message' => 'Seules les propositions en brouillon peuvent être modifiées.'], 409);
        $data = $request->validate([
            'message' => ['nullable', 'string'], 'description' => ['nullable', 'string'], 'conditions' => ['nullable', 'string'],
            'start_at' => ['nullable', 'date'], 'end_at' => ['nullable', 'date', 'after_or_equal:start_at'],
            'workload_percent' => ['nullable', 'integer', 'min:0', 'max:100'], 'remote' => ['boolean'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:today'],
        ]);
        $proposal->update($data);
        return $this->appendDisplay($proposal);
    }

    public function show(Request $request, Proposal $proposal)
    {
        $user = $request->user();
        $companyIds = $user->companies()->pluck('id')->toArray();
        $isRecipient = in_array($proposal->to_company_id, $companyIds) || ($proposal->resourceRequest && in_array($proposal->resourceRequest->company_id, $companyIds));
        $isTargetTalent = $user->professionalProfile && $user->professionalProfile->id === $proposal->professional_profile_id && !empty($proposal->proposed_by_company_id) && !in_array($proposal->proposed_by_company_id, $companyIds);
        if (($isRecipient || $isTargetTalent) && $proposal->status === 'sent') $proposal->update(['status' => 'viewed', 'viewed_at' => now()]);

        $proposal->load(['resourceRequest.company', 'resourceRequest.skills', 'resourceOffer.company', 'resourceOffer.profile.user', 'resourceOffer.skills', 'profile.user', 'proposingCompany', 'toCompany', 'documents.uploader:id,name', 'mission']);
        return $this->appendDisplay($proposal);
    }

    public function accept(Request $request, Proposal $proposal, NotificationService $notifications)
    {
        $this->authorizeRecipient($request, $proposal);
        if (!in_array($proposal->status, ['sent', 'viewed'])) return response()->json(['message' => 'Cette proposition ne peut plus être acceptée.'], 409);

        if ($proposal->proposed_by_company_id && $proposal->to_company_id) {
            return app(CompanyProposalController::class)->acceptCompanyProposal($request, $proposal, $notifications);
        }
        if ($this->isTalentApplication($proposal)) {
            return response()->json(['message' => "Planifiez d'abord un entretien : la candidature sera acceptée après sa validation.", 'code' => 'interview_required'], 409);
        }

        $resourceRequest = $proposal->resourceRequest;

        if ($this->isReverseFlow($proposal)) {
            $proposal->update(['status' => 'accepted', 'responded_at' => now(), 'interview_status' => 'pending', 'contract_kind' => $proposal->contract_kind ?? $this->resolveContractKind($resourceRequest)]);
            try {
                $owner = $proposal->proposingCompany?->owner;
                if ($owner) {
                    $talentName = $proposal->profile?->user?->name ?? 'Le talent';
                    $notifications->notify($owner, 'proposal_accepted', '✅ Proposition acceptée !', "{$talentName} a accepté votre proposition. Planifiez maintenant l'entretien.", $proposal, ['url' => "/proposals/{$proposal->id}", 'proposal_id' => $proposal->id]);
                }
            } catch (\Exception $e) { \Log::warning('Notification failed: ' . $e->getMessage()); }
            return response()->json(['proposal' => $this->appendDisplay($proposal), 'mission' => null]);
        }

        $proposal->update(['status' => 'accepted', 'responded_at' => now()]);
        $jobType = $resourceRequest?->type ?? 'job';
        $startAt = $proposal->start_at ?? $resourceRequest?->start_at ?? now();
        $endAt = $proposal->end_at ?? $resourceRequest?->end_at ?? now()->addMonth();
        $isInternship = in_array($jobType, ['internship', 'stage']);
        $initialStatus = $isInternship ? 'planned' : 'pending_employee';

        $mission = Mission::create([
            'proposal_id' => $proposal->id, 'requesting_company_id' => $proposal->to_company_id ?? $resourceRequest?->company_id,
            'supplying_company_id' => null, 'professional_profile_id' => $proposal->professional_profile_id,
            'start_at' => $startAt, 'end_at' => $isInternship ? $endAt : now()->addMonth(),
            'workload_percent' => 100, 'remote' => false, 'status' => $initialStatus,
        ]);

        // ✅ NOUVELLE LOGIQUE
        if ($resourceRequest) {
            $missionsCount = Mission::whereHas('proposal', function ($q) use ($resourceRequest) {
                $q->where('resource_request_id', $resourceRequest->id);
            })->whereIn('status', ['pending_employee', 'planned', 'active', 'trial'])->count();

            if ($missionsCount >= $resourceRequest->positions_count) {
                $resourceRequest->update(['status' => 'filled']);
            } else {
                $resourceRequest->update(['status' => 'published']);
            }
            
            // ✅ APPEL DE LA FONCTION POUR LE GROUPE ET LES NOTIFS
            $this->handleCollaborationGroup($resourceRequest, $mission, $notifications);
        }

        try {
            $talent = $proposal->profile->user;
            $notifications->notify($talent, 'proposal_accepted', '✅ Proposition acceptée !', $isInternship ? 'Votre entretien pour le stage est validé. Consultez votre mission.' : "Votre période d'essai d'1 mois commence. Bon courage !", $mission, ['url' => "/missions/{$mission->id}", 'mission_id' => $mission->id]);
        } catch (\Exception $e) { \Log::warning('Notification failed: ' . $e->getMessage()); }

        return response()->json(['proposal' => $this->appendDisplay($proposal), 'mission' => $mission], 201);
    }

    public function decline(Request $request, Proposal $proposal, NotificationService $notifications)
    {
        $this->authorizeRecipient($request, $proposal);
        if (!in_array($proposal->status, ['sent', 'viewed'])) return response()->json(['message' => 'Cette proposition ne peut plus être refusée.'], 409);
        $proposal->update(['status' => 'declined', 'responded_at' => now()]);
        try {
            if ($proposal->proposingCompany?->owner) {
                $notifications->notify($proposal->proposingCompany->owner, 'proposal_declined', '❌ Votre proposition a été refusée', "La proposition pour \"{$proposal->profile->user->name}\" a été refusée.", $proposal, ['url' => "/proposals/{$proposal->id}", 'proposal_id' => $proposal->id]);
            }
        } catch (\Exception $e) { \Log::warning('Notification failed: ' . $e->getMessage()); }
        return $this->appendDisplay($proposal);
    }

    public function scheduleInterview(Request $request, Proposal $proposal, NotificationService $notifications)
    {
        $this->authorizeInterviewManager($request, $proposal);
        if (!$this->interviewOpen($proposal)) return response()->json(['message' => "L'entretien ne peut plus être planifié pour cette proposition."], 409);

        $data = $request->validate([
            'interview_at' => ['required', 'date', 'after:now'], 'interview_mode' => ['required', 'in:visio,onsite'],
            'interview_location' => ['required_if:interview_mode,onsite', 'nullable', 'string', 'max:255'],
            'interview_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $proposal->loadMissing('profile.user', 'resourceRequest.company', 'proposingCompany', 'toCompany');
        $talent = $proposal->profile?->user;
        $interviewAt = Carbon::parse($data['interview_at'], 'Indian/Antananarivo');

        $link = null;
        if ($data['interview_mode'] === 'visio') {
            $room = 'TalentShare-Entretien-' . \Illuminate\Support\Str::slug($talent?->name ?? 'talent') . '-' . \Illuminate\Support\Str::slug($proposal->resourceRequest?->title ?? 'demande') . '-' . $proposal->id . '-' . \Illuminate\Support\Str::lower(\Illuminate\Support\Str::random(6));
            $frontend = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');
            $link = "{$frontend}/interview/{$room}?name=" . urlencode($talent?->name ?? '') . '&email=' . urlencode($talent?->email ?? '');
        }

        $proposal->update([
            'interview_at' => $interviewAt, 'interview_mode' => $data['interview_mode'],
            'interview_location' => $data['interview_mode'] === 'visio' ? 'Visioconférence' : $data['interview_location'],
            'interview_link' => $link, 'interview_notes' => $data['interview_notes'] ?? null, 'interview_status' => 'scheduled',
            'status' => ($this->isTalentApplication($proposal) && $proposal->status === 'sent') ? 'viewed' : $proposal->status,
        ]);

        if (class_exists(\App\Mail\ProposalInterviewScheduled::class)) {
            $fresh = $proposal->fresh(['profile.user', 'resourceRequest.company', 'proposingCompany', 'toCompany']);
            $company = $fresh->proposingCompany ?? $fresh->toCompany ?? $fresh->resourceRequest?->company;
            $targets = [];
            if ($talent?->email) $targets[] = ['talent', $talent];
            collect([$request->user(), $company?->owner])->filter()->unique('id')->each(function ($user) use (&$targets) { $targets[] = ['recruiter', $user]; });
            foreach ($targets as [$role, $user]) {
                try { \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\ProposalInterviewScheduled($fresh, $role, $user)); }
                catch (\Throwable $e) { \Log::warning("Email entretien ({$role}): " . $e->getMessage()); }
            }
        }

        try {
            if ($talent) {
                $company = $proposal->proposingCompany ?? $proposal->toCompany ?? $proposal->resourceRequest?->company;
                $when = $interviewAt->format('d/m/Y à H:i');
                $notifications->notify($talent, 'interview_scheduled', '📅 Entretien planifié', ($company?->name ?? "L'entreprise") . " vous convie à un entretien le {$when}.", $proposal, ['url' => "/proposals/{$proposal->id}", 'proposal_id' => $proposal->id]);
            }
        } catch (\Exception $e) { \Log::warning('Notification failed: ' . $e->getMessage()); }

        return $this->appendDisplay($proposal->fresh());
    }

    public function validateInterview(Request $request, Proposal $proposal, NotificationService $notifications)
    {
        $this->authorizeInterviewManager($request, $proposal);
        if (!$this->interviewOpen($proposal) || $proposal->interview_status !== 'scheduled') return response()->json(['message' => "L'entretien doit d'abord être planifié."], 409);
        if (Mission::where('proposal_id', $proposal->id)->exists()) return response()->json(['message' => 'Une mission existe déjà pour cette proposition.'], 409);

        $isApplication = $this->isTalentApplication($proposal);
        $resourceRequest = $proposal->resourceRequest;
        $contract = ContractService::buildFromRequest($resourceRequest?->contract_type, $proposal->start_at ?? $resourceRequest?->start_at, $proposal->end_at ?? $resourceRequest?->end_at);
        $isJob = $contract['is_trial'];
        $kind = $this->resolveContractKind($resourceRequest);
        $requestingCompanyId = $isApplication ? ($proposal->to_company_id ?? $resourceRequest?->company_id) : $proposal->proposed_by_company_id;
        $status = $isJob ? 'trial' : (Carbon::parse($contract['start_at'])->lte(now()->endOfDay()) ? 'active' : 'planned');

             $mission = DB::transaction(function () use (
            $proposal, $resourceRequest, $contract, $isJob, $isApplication, $requestingCompanyId, $status, $kind, $notifications // ✅ Ajout de $notifications
        ) {
            $mission = Mission::create([
                'proposal_id' => $proposal->id, 'title' => $resourceRequest?->title,
                'contract_type' => $contract['contract_type'], 'requesting_company_id' => $requestingCompanyId,
                'supplying_company_id' => null, 'professional_profile_id' => $proposal->professional_profile_id,
                'start_at' => $contract['start_at'], 'end_at' => $contract['end_at'],
                'is_trial' => $isJob, 'trial_ends_at' => $contract['trial_ends_at'],
                'workload_percent' => $proposal->workload_percent ?? $resourceRequest?->workload_percent ?? 100,
                'remote' => (bool) ($proposal->remote || $resourceRequest?->remote), 'status' => $status,
            ]);

            $proposal->update(array_filter([
                'contract_kind' => $kind, 'interview_status' => 'validated', 'interview_validated_at' => now(),
                'status' => $isApplication ? 'accepted' : null, 'responded_at' => $isApplication ? now() : null,
            ], fn ($v) => $v !== null));

            // ✅ NOUVELLE LOGIQUE
            if ($resourceRequest) {
                $missionsCount = Mission::whereHas('proposal', function ($q) use ($resourceRequest) {
                    $q->where('resource_request_id', $resourceRequest->id);
                })->whereIn('status', ['pending_employee', 'planned', 'active', 'trial'])->count();

                if ($missionsCount >= $resourceRequest->positions_count) {
                    $resourceRequest->update(['status' => 'filled']);
                } else {
                    $resourceRequest->update(['status' => 'published']);
                }
                
                // ✅ APPEL DE LA FONCTION POUR LE GROUPE ET LES NOTIFS
                $this->handleCollaborationGroup($resourceRequest, $mission, $notifications);
            }
            return $mission;
        });

        $this->upsertEmployee($mission, $proposal, $contract);

        try {
            $talent = $proposal->profile?->user;
            if ($talent) {
                $notifications->notify($talent, 'mission_created', $isJob ? "🎉 Entretien validé : période d'essai" : '🎉 Entretien validé : mission créée', $isJob ? "Votre entretien est validé. Votre période d'essai d'1 mois commence." : 'Votre entretien est validé. Votre mission est créée du ' . Carbon::parse($contract['start_at'])->format('d/m/Y') . ' au ' . Carbon::parse($contract['end_at'])->format('d/m/Y') . '.', $mission, ['url' => "/missions/{$mission->id}", 'mission_id' => $mission->id]);
            }
        } catch (\Exception $e) { \Log::warning('Notification failed: ' . $e->getMessage()); }

        return response()->json(['proposal' => $this->appendDisplay($proposal->fresh()), 'mission' => $mission], 201);
    }

    public function rejectInterview(Request $request, Proposal $proposal, NotificationService $notifications)
    {
        $this->authorizeInterviewManager($request, $proposal);
        if (!$this->interviewOpen($proposal)) return response()->json(['message' => 'Action impossible à ce stade.'], 409);
        $proposal->update(array_filter([
            'interview_status' => 'failed',
            'status' => $this->isTalentApplication($proposal) ? 'declined' : null,
            'responded_at' => $this->isTalentApplication($proposal) ? now() : null,
        ], fn ($v) => $v !== null));

        try {
            $talent = $proposal->profile?->user;
            if ($talent) {
                $company = $proposal->proposingCompany ?? $proposal->toCompany ?? $proposal->resourceRequest?->company;
                $notifications->notify($talent, 'interview_failed', 'Entretien non concluant', ($company?->name ?? "L'entreprise") . " n'a pas donné suite après l'entretien.", $proposal, ['url' => "/proposals/{$proposal->id}", 'proposal_id' => $proposal->id]);
            }
        } catch (\Exception $e) { \Log::warning('Notification failed: ' . $e->getMessage()); }
        return $this->appendDisplay($proposal->fresh());
    }

    private function isTalentApplication(Proposal $proposal): bool
    {
        return empty($proposal->proposed_by_company_id) && !empty($proposal->resource_request_id) && $proposal->resourceRequest?->author_type !== 'talent';
    }
    private function interviewOpen(Proposal $proposal): bool
    {
        $open = $this->isTalentApplication($proposal) ? in_array($proposal->status, ['sent', 'viewed']) : $proposal->status === 'accepted';
        return $open && in_array($proposal->interview_status ?? 'pending', ['pending', 'scheduled']);
    }
    private function authorizeInterviewManager(Request $request, Proposal $proposal): void
    {
        $companyIds = $request->user()->companies()->pluck('id')->toArray();
        $isReverseSender = $this->isReverseFlow($proposal) && in_array($proposal->proposed_by_company_id, $companyIds);
        $isApplicationRecipient = $this->isTalentApplication($proposal) && (in_array($proposal->to_company_id, $companyIds) || in_array($proposal->resourceRequest?->company_id, $companyIds));
        abort_unless($isReverseSender || $isApplicationRecipient, 403, "Vous n'êtes pas autorisé à gérer cet entretien.");
    }
    private function appendDisplay(Proposal $p): Proposal
    {
        try { $p->append(['display_status', 'status_label', 'days_until_expiry', 'is_pending']); }
        catch (\Exception $e) { \Log::warning('appendDisplay failed: ' . $e->getMessage()); }
        return $p;
    }
    private function isReverseFlow(Proposal $proposal): bool
    {
        return !empty($proposal->proposed_by_company_id) && $proposal->resourceRequest?->author_type === 'talent';
    }
    private function resolveContractKind(?ResourceRequest $request): string
    {
        return match (ContractService::typeFromRequestContract($request?->contract_type)) {
            'permanent' => 'job', 'fixed_term' => 'fixed_term', default => 'internship',
        };
    }
    private function notifyRecipient(Proposal $proposal): void
    {
        try {
            $notifications = app(NotificationService::class);
            $targetCompany = $proposal->toCompany ?? $proposal->resourceRequest?->company;
            $ownerId = $targetCompany?->owner_user_id;
            $isTalentProposal = empty($proposal->proposed_by_company_id);

            if ($isTalentProposal) { $authorName = $proposal->profile?->user?->name ?? 'Un talent'; $bodyText = "{$authorName} a postulé à votre demande"; }
            else { $authorName = $proposal->proposingCompany?->name ?? 'Une entreprise'; $candidateName = $proposal->profile?->user?->name ?? 'un talent'; $bodyText = "{$authorName} vous propose : {$candidateName}"; }

            if ($ownerId) {
                $owner = \App\Models\User::find($ownerId);
                if ($owner) { $notifications->notify($owner, 'proposal_received', '📥 Nouvelle proposition reçue', $bodyText, $proposal, ['url' => "/proposals/{$proposal->id}", 'proposal_id' => $proposal->id, 'match_score' => $proposal->match_score]); }
            }
            if (!$targetCompany && $proposal->profile?->user) {
                $notifications->notify($proposal->profile->user, 'proposal_received', '🎯 Nouvelle opportunité !', "{$authorName} souhaite vous proposer une mission.", $proposal, ['url' => "/proposals/{$proposal->id}", 'proposal_id' => $proposal->id, 'match_score' => $proposal->match_score]);
            }
        } catch (\Exception $e) { \Log::error('notifyRecipient failed: ' . $e->getMessage()); }
    }
    public function countNew(Request $request)
    {
        try {
            $user = $request->user();
            $companyIds = $user->companies()->pluck('id')->toArray();
            $profile = $user->professionalProfile;
            if (empty($companyIds) && !$profile) return response()->json(['count' => 0]);
            $since = $user->proposals_last_seen_at;
            $query = Proposal::query();
            if (!empty($companyIds)) { $query->where(function ($q) use ($companyIds) { $q->whereIn('to_company_id', $companyIds)->orWhereHas('resourceRequest', fn ($sq) => $sq->whereIn('company_id', $companyIds)); }); }
            if ($profile && empty($companyIds)) { $query->where('professional_profile_id', $profile->id); }
            $query->whereIn('status', ['sent', 'viewed']);
            if ($since) $query->where('created_at', '>', $since);
            else $query->where('created_at', '>', now()->subDays(30));
            return response()->json(['count' => $query->count()]);
        } catch (\Exception $e) { \Log::error('countNew() failed: ' . $e->getMessage()); return response()->json(['count' => 0]); }
    }
    public function markSeen(Request $request)
    {
        $request->user()?->update(['proposals_last_seen_at' => now()]);
        return response()->json(['success' => true]);
    }
    private function authorizeSender(Request $request, Proposal $proposal): void
    {
        $isSender = $request->user()->companies()->where('id', $proposal->proposed_by_company_id)->exists();
        $isTalentAuthor = $request->user()->professionalProfile && $request->user()->professionalProfile->id === $proposal->professional_profile_id && empty($proposal->proposed_by_company_id);
        abort_unless($isSender || $isTalentAuthor, 403, 'Vous n\'êtes pas autorisé à modifier cette proposition.');
    }
    private function authorizeRecipient(Request $request, Proposal $proposal): void
    {
        $user = $request->user();
        $companyIds = $user->companies()->pluck('id')->toArray();
        if (!empty($proposal->proposed_by_company_id) && in_array($proposal->proposed_by_company_id, $companyIds)) abort(403, 'Vous ne pouvez pas répondre à votre propre proposition.');
        $isRecipientCompany = in_array($proposal->to_company_id, $companyIds) || ($proposal->resourceRequest && in_array($proposal->resourceRequest->company_id, $companyIds));
        $isTargetTalent = $user->professionalProfile && $user->professionalProfile->id === $proposal->professional_profile_id;
        abort_unless($isRecipientCompany || $isTargetTalent, 403, 'Seule l\'entreprise destinataire ou le talent concerné peut répondre.');
    }
    public function recruiterApply(Request $request, NotificationService $notifications)
    {
        $data = $request->validate([
            'resource_request_id' => ['required', 'exists:resource_requests,id'],
            'proposed_by_company_id' => ['required', 'exists:companies,id'],
            'employee_id' => ['required', 'integer', 'exists:professional_profiles,id'],
            'message' => ['required', 'string', 'min:20'], 'conditions' => ['nullable', 'string'],
            'start_at' => ['nullable', 'date'], 'end_at' => ['nullable', 'date', 'after_or_equal:start_at'], 'status' => ['required', 'in:sent'],
        ]);
        if ($request->user()->companies()->where('id', $data['proposed_by_company_id'])->doesntExist()) return response()->json(['message' => 'Cette entreprise ne vous appartient pas.'], 403);
        $resourceRequest = ResourceRequest::findOrFail($data['resource_request_id']);
        if ($resourceRequest->display_status !== 'published') return response()->json(['message' => "Cette demande n'accepte plus de propositions.", 'code' => 'request_closed'], 409);
        if ($resourceRequest->author?->id === $request->user()->id) return response()->json(['message' => 'Vous ne pouvez pas répondre à votre propre demande.'], 403);
        $employeeProfile = \App\Models\ProfessionalProfile::find($data['employee_id']);
        if (!$employeeProfile) return response()->json(['message' => 'Ce salarié n\'existe pas.'], 404);
        $duplicate = Proposal::where('resource_request_id', $resourceRequest->id)->where('proposed_by_company_id', $data['proposed_by_company_id'])->whereNotIn('status', ['cancelled', 'declined', 'expired'])->exists();
        if ($duplicate) return response()->json(['message' => 'Votre entreprise a déjà envoyé une proposition pour cette demande.', 'code' => 'duplicate_proposal'], 409);

        $proposal = Proposal::create([
            'resource_request_id' => $resourceRequest->id, 'professional_profile_id' => $data['employee_id'],
            'proposed_by_company_id' => $data['proposed_by_company_id'], 'to_company_id' => $resourceRequest->company_id ?? null,
            'message' => $data['message'], 'conditions' => $data['conditions'] ?? null,
            'start_at' => $data['start_at'] ?? null, 'end_at' => $data['end_at'] ?? null,
            'status' => 'sent', 'sent_at' => now(), 'expires_at' => now()->addDays(30),
            'contract_kind' => $this->resolveContractKind($resourceRequest),
        ]);

        try {
            $recipient = $resourceRequest->company?->owner ?? $resourceRequest->author;
            if ($recipient) {
                $companyName = $proposal->proposingCompany?->name ?? 'Une entreprise';
                $notifications->notify($recipient, 'proposal_received', '📩 Nouvelle proposition de collaboration', "{$companyName} vous propose un talent pour votre demande : {$resourceRequest->title}.", $proposal, ['url' => "/proposals/{$proposal->id}", 'proposal_id' => $proposal->id]);
            }
        } catch (\Exception $e) { \Log::warning('Erreur notif recruteur: ' . $e->getMessage()); }
        return response()->json($this->appendDisplay($proposal->load(['profile.user', 'proposingCompany', 'resourceRequest'])), 201);
    }
    public function applyToResourceOffer(Request $request, NotificationService $notifications)
    {
        $data = $request->validate([
            'resource_offer_id' => ['required', 'exists:resource_offers,id'], 'proposed_by_company_id' => ['required', 'exists:companies,id'],
            'message' => ['required', 'string', 'min:20'], 'conditions' => ['nullable', 'string'],
            'start_at' => ['nullable', 'date'], 'end_at' => ['nullable', 'date', 'after_or_equal:start_at'],
        ]);
        if ($request->user()->companies()->where('id', $data['proposed_by_company_id'])->doesntExist()) return response()->json(['message' => 'Cette entreprise ne vous appartient pas.'], 403);
        $offer = ResourceOffer::with(['company', 'profile.user'])->findOrFail($data['resource_offer_id']);
        if ($offer->status !== 'published') return response()->json(['message' => "Cette offre n'est plus disponible.", 'code' => 'offer_closed'], 409);
        if ($offer->company_id === $data['proposed_by_company_id']) return response()->json(['message' => 'Vous ne pouvez pas postuler à votre propre offre.'], 403);
        $duplicate = Proposal::where('resource_offer_id', $offer->id)->where('proposed_by_company_id', $data['proposed_by_company_id'])->whereNotIn('status', ['cancelled', 'declined', 'expired'])->exists();
        if ($duplicate) return response()->json(['message' => 'Votre entreprise a déjà fait une proposition pour cette offre.', 'code' => 'duplicate_proposal'], 409);

        $proposal = Proposal::create([
            'resource_offer_id' => $offer->id, 'professional_profile_id' => $offer->professional_profile_id,
            'proposed_by_company_id' => $data['proposed_by_company_id'], 'to_company_id' => $offer->company_id,
            'message' => $data['message'], 'conditions' => $data['conditions'] ?? null,
            'start_at' => $data['start_at'] ?? $offer->start_at, 'end_at' => $data['end_at'] ?? $offer->end_at,
            'status' => 'sent', 'sent_at' => now(), 'expires_at' => now()->addDays(30),
        ]);

        try {
            $companyOwner = $offer->company->owner;
            if ($companyOwner) {
                $proposingCompany = \App\Models\Company::find($data['proposed_by_company_id']);
                $proposingCompanyName = $proposingCompany ? $proposingCompany->name : 'Une entreprise';
                $notifications->notify($companyOwner, 'proposal_received', '📩 Nouvelle proposition de collaboration', "{$proposingCompanyName} souhaite collaborer avec vous pour le profil de {$offer->profile?->user?->name}.", $proposal, ['url' => "/proposals/{$proposal->id}", 'proposal_id' => $proposal->id]);
            }
        } catch (\Exception $e) { \Log::warning('Erreur notif offre ressource: ' . $e->getMessage()); }
        return response()->json($this->appendDisplay($proposal->load(['profile.user', 'proposingCompany', 'toCompany'])), 201);
    }
    private function upsertEmployee(Mission $mission, Proposal $proposal, array $contract): void
    {
        try {
            $applicant = $proposal->profile?->user;
            if (!$applicant || !$mission->requesting_company_id) return;
            \App\Models\Employee::updateOrCreate(
                ['company_id' => $mission->requesting_company_id, 'user_id' => $applicant->id],
                [
                    'position' => $proposal->resourceRequest?->title ?? $proposal->profile?->headline ?? 'Salarié',
                    'status' => $contract['is_trial'] ? 'trial' : 'active', 'contract_type' => $contract['contract_type'],
                    'start_date' => $contract['start_at'], 'end_date' => $contract['end_at'],
                    'has_account' => true, 'first_name' => $applicant->first_name ?? explode(' ', $applicant->name)[0] ?? '',
                    'last_name' => $applicant->last_name ?? explode(' ', $applicant->name)[1] ?? '',
                    'email' => $applicant->email, 'phone' => $applicant->phone,
                ]
            );
        } catch (\Exception $e) { \Log::error('Erreur création employé (proposition) : ' . $e->getMessage()); }
    }

    /**
     * ✅ Gère le groupe de discussion et les notifications pour les collaborateurs multiples
     */
    private function handleCollaborationGroup(ResourceRequest $resourceRequest, Mission $mission, NotificationService $notifications): void
    {
        // 1. Récupérer toutes les missions actives pour cette demande
        $activeMissions = Mission::whereHas('proposal', function ($q) use ($resourceRequest) {
            $q->where('resource_request_id', $resourceRequest->id);
        })->whereIn('status', ['pending_employee', 'planned', 'active', 'trial'])
          ->with('profile.user')
          ->get();

        // 2. Récupérer les utilisateurs concernés (Talents + Owner de l'entreprise)
        $talentUsers = $activeMissions->pluck('profile.user')->filter();
        $companyOwner = $resourceRequest->company?->owner;
        
        $participantIds = $talentUsers->pluck('id')->toArray();
        if ($companyOwner) {
            $participantIds[] = $companyOwner->id;
        }
        $participantIds = array_unique(array_filter($participantIds));

        // 3. Notification pour les autres talents (s'il y en a)
        if ($talentUsers->count() > 1) {
            foreach ($talentUsers as $talent) {
                // On ne notifie pas le talent qui vient d'être accepté (le nouveau)
                if ($talent->id === $mission->profile->user_id) continue;

                try {
                    // ✅ On cherche LA mission du collaborateur qui reçoit la notification
                    $collaboratorMission = Mission::where('professional_profile_id', $talent->professionalProfile->id)
                        ->where('proposal_id', $mission->proposal_id)
                        ->first();

                    $targetMissionId = $collaboratorMission ? $collaboratorMission->id : $mission->id;

                    $notifications->notify(
                        $talent, // ✅ C'est $talent (l'utilisateur), pas $newUser
                        'new_collaborator',
                        '👥 Nouveau collaborateur',
                        "Un nouveau membre a rejoint la mission « {$mission->title} ».",
                        $collaboratorMission ?? $mission,
                        ['url' => "/missions/{$targetMissionId}"] // ✅ Pointe vers SA mission
                    );
                } catch (\Exception $e) {
                    \Log::warning('Notif nouveau collaborateur failed: ' . $e->getMessage());
                }
            }
        }

        // 4. Création ou mise à jour du groupe de discussion
        if (count($participantIds) >= 2) {
            $title = "Mission : " . $resourceRequest->title;
            
            // On cherche si le groupe existe déjà
            $conversation = \App\Models\Conversation::where('title', $title)->first();
            $newTalent = $mission->profile?->user;
            $companyName = $resourceRequest->company?->name ?? "L'entreprise";

            if ($conversation) {
                // ✅ LE GROUPE EXISTE DÉJÀ (2ème candidat ou plus)
                // On ajoute le nouveau participant s'il n'y est pas
                $conversation->participants()->syncWithoutDetaching($participantIds);

                // ✅ On envoie juste un petit message système
                if ($newTalent) {
                    \App\Models\Message::create([
                        'conversation_id' => $conversation->id,
                        'sender_id' => $companyOwner ? $companyOwner->id : $resourceRequest->created_by,
                        'body' => "📢 **{$companyName}** a ajouté **{$newTalent->name}** au groupe pour la mission « {$resourceRequest->title} ». Bienvenue !",
                    ]);
                }
            } else {
                // ✅ LE GROUPE N'EXISTE PAS (1er candidat)
                // On crée la conversation
                $conversation = \App\Models\Conversation::create(['title' => $title]);
                $conversation->participants()->attach($participantIds);

                // ✅ Message d'accueil complet avec les consignes
                \App\Models\Message::create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $companyOwner ? $companyOwner->id : $resourceRequest->created_by,
                    'body' => "Bienvenue dans le groupe de la mission « {$resourceRequest->title} » !\n\n" .
                              "Voici les consignes de l'entreprise :\n" .
                              ($resourceRequest->description ? "{$resourceRequest->description}\n\n" : "") .
                              ($resourceRequest->conditions ? "Conditions : {$resourceRequest->conditions}\n\n" : "") .
                              "N'hésitez pas à poser vos questions ici. Bon travail à tous !",
                ]);
            }
        }
    }
}