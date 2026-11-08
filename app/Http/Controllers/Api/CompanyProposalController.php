<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Mission;
use App\Models\Proposal;
use App\Models\ResourceOffer;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

/**
 * P0-11 : une entreprise sélectionne une ressource (ResourceOffer) et l'envoie
 * à l'entreprise prêteuse. Workflow : draft → sent → viewed → accepted | declined | expired (| cancelled)
 *
 * Rôles : proposed_by_company_id = entreprise qui veut le salarié (demandeuse)
 *         to_company_id          = entreprise propriétaire de l'offre (prêteuse)
 */
class CompanyProposalController extends Controller
{
    /** Valeur de documents.type utilisée pour les pièces jointes (adapte-la si ta colonne est un enum). */
    private const DOC_TYPE = 'other';

    private const OPEN_STATUSES = ['draft', 'sent', 'viewed', 'accepted'];

    // ============================================
    // STORE (brouillon ou envoi direct)
    // ============================================
    public function store(Request $request, NotificationService $notifications)
    {
        $data = $request->validate([
            'resource_offer_id'      => ['required', 'exists:resource_offers,id'],
            'proposed_by_company_id' => ['required', 'exists:companies,id'],
            'description'            => ['nullable', 'string', 'max:5000'],
            'message'                => ['nullable', 'string', 'max:5000'],
            'conditions'             => ['nullable', 'string', 'max:3000'],
            'start_at'               => ['nullable', 'date'],
            'end_at'                 => ['nullable', 'date', 'after_or_equal:start_at'],
            'workload_percent'       => ['nullable', 'integer', 'min:1', 'max:100'],
            'remote'                 => ['boolean'],
            'expires_at'             => ['nullable', 'date', 'after_or_equal:today'],
            'status'                 => ['required', 'in:draft,sent'],
        ]);

        $company = $request->user()->companies()->where('companies.id', $data['proposed_by_company_id'])->first();
        if (!$company) {
            return response()->json(['message' => 'Cette entreprise ne vous appartient pas.'], 403);
        }

        $offer = ResourceOffer::with(['company', 'profile.user'])->findOrFail($data['resource_offer_id']);

        if ((int) $offer->company_id === (int) $company->id) {
            return response()->json(['message' => 'Vous ne pouvez pas proposer à votre propre offre.'], 403);
        }
        if (($offer->visibility ?? 'public') === 'private') {
            return response()->json(['message' => "Cette offre n'est pas accessible."], 403);
        }
        if ($offer->status !== 'published') {
            return response()->json(['message' => "Cette offre n'est plus disponible.", 'code' => 'offer_closed'], 409);
        }

        $duplicate = Proposal::where('resource_offer_id', $offer->id)
            ->where('proposed_by_company_id', $company->id)
            ->whereIn('status', self::OPEN_STATUSES)->exists();
        if ($duplicate) {
            return response()->json([
                'message' => 'Votre entreprise a déjà une proposition en cours pour cette offre.',
                'code'    => 'duplicate_proposal',
            ], 409);
        }

        $values = [
            'start_at'         => $data['start_at'] ?? Carbon::parse($offer->start_at)->toDateString(),
            'end_at'           => $data['end_at'] ?? Carbon::parse($offer->end_at)->toDateString(),
            'message'          => $data['message'] ?? null,
            'workload_percent' => $data['workload_percent'] ?? 100,
        ];

        if ($data['status'] === 'sent' && ($err = $this->guardSendable($values, $offer))) {
            return $err;
        }

        $proposal = Proposal::create([
            'resource_offer_id'       => $offer->id,
            'professional_profile_id' => $offer->professional_profile_id,
            'proposed_by_company_id'  => $company->id,
            'to_company_id'           => $offer->company_id,
            'description'             => $data['description'] ?? null,
            'message'                 => $values['message'],
            'conditions'              => $data['conditions'] ?? null,
            'start_at'                => $values['start_at'],
            'end_at'                  => $values['end_at'],
            'workload_percent'        => $values['workload_percent'],
            'remote'                  => $data['remote'] ?? false,
            'expires_at'              => $data['expires_at'] ?? now()->addDays(30)->toDateString(),
            'status'                  => $data['status'],
            'sent_at'                 => $data['status'] === 'sent' ? now() : null,
        ]);

        if ($proposal->status === 'sent') {
            $this->notifyLender($proposal, $notifications);
        }

        return response()->json($this->present($proposal), 201);
    }

    // ============================================
    // SUBMIT (brouillon → envoyée) — appelé par ProposalController::submit
    // ============================================
    public function submitOffer(Request $request, Proposal $proposal)
    {
        $this->authorizeSender($request, $proposal);

        if ($proposal->status !== 'draft') {
            return response()->json(['message' => 'Seules les propositions en brouillon peuvent être envoyées.'], 409);
        }

        $offer = ResourceOffer::with(['company', 'profile.user'])->find($proposal->resource_offer_id);
        if (!$offer) {
            return response()->json(['message' => "L'offre n'existe plus."], 409);
        }

        $err = $this->guardSendable([
            'message'          => $proposal->message,
            'start_at'         => $proposal->start_at?->toDateString(),
            'end_at'           => $proposal->end_at?->toDateString(),
            'workload_percent' => $proposal->workload_percent,
        ], $offer);
        if ($err) return $err;

        $expires = ($proposal->expires_at && $proposal->expires_at->gte(now()->startOfDay()))
            ? $proposal->expires_at
            : now()->addDays(30);

        $proposal->update(['status' => 'sent', 'sent_at' => now(), 'expires_at' => $expires]);

        $this->notifyLender($proposal, app(NotificationService::class));

        return response()->json($this->present($proposal));
    }

    // ============================================
    // ACCEPT — générique entreprise → entreprise (3 flux)
    //  - offer_application : B postule sur l'offre de A      → A (prêteuse) répond
    //  - direct_push       : A propose un talent à B         → B (demandeuse) répond
    //  - request_response  : A répond à la demande de B      → B (demandeuse) répond
    // Dans tous les cas le destinataire = to_company_id (l'expéditeur ne peut jamais répondre).
    // ============================================
    public function acceptOffer(Request $request, Proposal $proposal, NotificationService $notifications)
    {
        return $this->acceptCompanyProposal($request, $proposal, $notifications);
    }

    public function acceptCompanyProposal(Request $request, Proposal $proposal, NotificationService $notifications)
    {
        abort_unless(
            $request->user()->companies()->where('companies.id', $proposal->to_company_id)->exists(),
            403,
            "Seule l'entreprise destinataire peut répondre à cette proposition."
        );

        if (!in_array($proposal->status, ['sent', 'viewed'])) {
            return response()->json(['message' => 'Cette proposition ne peut plus être acceptée.'], 409);
        }
        if ($proposal->expires_at && $proposal->expires_at->lt(now()->startOfDay())) {
            return response()->json(['message' => 'Cette proposition a expiré.', 'code' => 'expired'], 409);
        }

        $offer = $proposal->resourceOffer;
        $req = $proposal->resourceRequest;
        $isOfferFlow = (bool) $proposal->resource_offer_id;

        if ($isOfferFlow) {
            if (!$offer || $offer->status !== 'published') {
                return response()->json(['message' => "Cette offre n'est plus disponible.", 'code' => 'offer_closed'], 409);
            }
            if (Mission::where('resource_offer_id', $offer->id)->whereIn('status', ResourceSharingController::MISSION_STATUSES)->exists()) {
                return response()->json(['message' => 'Une mission est déjà en cours pour cette offre.'], 409);
            }
        }
        if ($req && $req->display_status !== 'published') {
            return response()->json(['message' => "Cette demande n'accepte plus de propositions.", 'code' => 'request_closed'], 409);
        }

        // Qui prête, qui emprunte ?
        $lenderId   = $isOfferFlow ? $proposal->to_company_id : $proposal->proposed_by_company_id;
        $borrowerId = $isOfferFlow ? $proposal->proposed_by_company_id : $proposal->to_company_id;

        $start = $proposal->start_at ?? $offer?->start_at ?? $req?->start_at ?? now();
        $end   = $proposal->end_at ?? $offer?->end_at ?? $req?->end_at ?? Carbon::parse($start)->addMonths(3);

        $overlap = Mission::where('professional_profile_id', $proposal->professional_profile_id)
            ->whereIn('status', ['pending_employee', 'planned', 'active', 'trial'])
            ->where('start_at', '<=', $end)
            ->where(fn ($q) => $q->whereNull('end_at')->orWhere('end_at', '>=', $start))
            ->exists();
        if ($overlap) {
            return response()->json(['message' => 'Ce talent a déjà une mission sur cette période.', 'code' => 'mission_overlap'], 409);
        }

        $mission = DB::transaction(function () use ($proposal, $offer, $req, $lenderId, $borrowerId, $start, $end) {
            $proposal->update(['status' => 'accepted', 'responded_at' => now()]);
            $req?->update(['status' => 'closed']);

            return Mission::create([
                'proposal_id'             => $proposal->id,
                'resource_offer_id'       => $proposal->resource_offer_id,
                'requesting_company_id'   => $borrowerId,
                'supplying_company_id'    => $lenderId,
                'professional_profile_id' => $proposal->professional_profile_id,
                'start_at'                => $start,
                'end_at'                  => $end,
                'workload_percent'        => $proposal->workload_percent
                    ?? ($offer && $offer->workload_unit === 'percentage' ? $offer->workload_value : 100),
                'remote'                  => (bool) ($proposal->remote ?? ($offer ? in_array($offer->location_type, ['remote', 'hybrid']) : false)),
                'status'                  => 'pending_employee', // le salarié doit confirmer (MissionController::accept)
            ]);
        });

        try {
            $proposal->loadMissing(['profile.user', 'proposingCompany.owner', 'toCompany']);
            $lender = $lenderId === $proposal->proposed_by_company_id ? $proposal->proposingCompany : $proposal->toCompany;
            $borrower = $borrowerId === $proposal->proposed_by_company_id ? $proposal->proposingCompany : $proposal->toCompany;

            if ($talent = $proposal->profile?->user) {
                $notifications->notify(
                    $talent, 'mission_pending_approval', '🎯 Nouvelle mission proposée',
                    ($lender?->name ?? 'Votre entreprise') . ' souhaite vous prêter à ' . ($borrower?->name ?? 'une autre entreprise') . '. En attente de votre accord.',
                    $mission, ['url' => "/missions/{$mission->id}", 'mission_id' => $mission->id]
                );
            }
            if ($owner = $proposal->proposingCompany?->owner) {
                $notifications->notify(
                    $owner, 'proposal_accepted', '✅ Proposition acceptée !',
                    ($proposal->toCompany?->name ?? 'L’entreprise') . ' a accepté votre proposition. En attente de l’accord du salarié.',
                    $proposal, ['url' => "/proposals/{$proposal->id}", 'proposal_id' => $proposal->id]
                );
            }
        } catch (\Throwable $e) {
            \Log::warning('Notification failed: ' . $e->getMessage());
        }

        return response()->json(['proposal' => $this->present($proposal->fresh()), 'mission' => $mission], 201);
    }

    // ============================================
    // DOCUMENTS
    // ============================================
    public function uploadDocument(Request $request, Proposal $proposal)
    {
        $this->authorizeSender($request, $proposal);

        if (!in_array($proposal->status, ['draft', 'sent'])) {
            return response()->json(['message' => 'Les documents ne peuvent plus être modifiés.'], 409);
        }
        if ($proposal->documents()->count() >= 10) {
            return response()->json(['message' => 'Maximum 10 documents par proposition.'], 422);
        }

        $request->validate([
            'file' => ['required', 'file', 'max:10240', 'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,png,jpg,jpeg,txt'],
        ]);

        $file = $request->file('file');
        $path = $file->store("proposals/{$proposal->id}", 'public');

        $doc = $proposal->documents()->make();
        $attrs = [
            'type'          => self::DOC_TYPE,
            'file_path'     => $path,
            'name'          => $file->getClientOriginalName(),
            'original_name' => $file->getClientOriginalName(),
            'mime_type'     => $file->getClientMimeType(),
            'size'          => $file->getSize(),
        ];
        try {
            $attrs[$doc->uploader()->getForeignKeyName()] = $request->user()->id;
        } catch (\Throwable $e) {
            // pas de relation uploader : on ignore
        }

        $table = $doc->getTable();
        foreach ($attrs as $col => $val) {
            if (Schema::hasColumn($table, $col)) {
                $doc->setAttribute($col, $val);
            }
        }
        $doc->save();

        return response()->json($doc->load('uploader:id,name'), 201);
    }

    public function deleteDocument(Request $request, Proposal $proposal, Document $document)
    {
        $this->authorizeSender($request, $proposal);

        abort_unless(
            $document->documentable_type === get_class($proposal) && (int) $document->documentable_id === $proposal->id,
            404
        );
        if (!in_array($proposal->status, ['draft', 'sent'])) {
            return response()->json(['message' => 'Les documents ne peuvent plus être modifiés.'], 409);
        }

        Storage::disk('public')->delete($document->file_path);
        $document->delete();

        return response()->json(['message' => 'Document supprimé.']);
    }

    // ============================================
    // HELPERS
    // ============================================
    /** Retourne une réponse d'erreur si la proposition n'est pas envoyable, sinon null. */
    private function guardSendable(array $v, ResourceOffer $offer): ?JsonResponse
    {
        if ($offer->status !== 'published') {
            return response()->json(['message' => "Cette offre n'est plus disponible.", 'code' => 'offer_closed'], 409);
        }
        if (Mission::where('resource_offer_id', $offer->id)->whereIn('status', ResourceSharingController::MISSION_STATUSES)->exists()) {
            return response()->json(['message' => 'Une mission est déjà en cours pour cette offre.', 'code' => 'offer_taken'], 409);
        }

        $errors = [];
        if (mb_strlen(trim((string) ($v['message'] ?? ''))) < 20) {
            $errors['message'] = ["Le message d'accompagnement doit contenir au moins 20 caractères."];
        }
        if (empty($v['start_at']) || empty($v['end_at'])) {
            $errors['start_at'] = ['La période est obligatoire pour envoyer la proposition.'];
        } else {
            $oStart = Carbon::parse($offer->start_at)->startOfDay();
            $oEnd = Carbon::parse($offer->end_at)->startOfDay();
            if (Carbon::parse($v['start_at'])->lt($oStart) || Carbon::parse($v['end_at'])->gt($oEnd)) {
                $errors['start_at'] = ["La période doit rester dans celle de l'offre (du {$oStart->format('d/m/Y')} au {$oEnd->format('d/m/Y')})."];
            }
        }
        if ($errors) {
            return response()->json(['message' => collect($errors)->flatten()->first(), 'errors' => $errors], 422);
        }

        $overlap = Mission::where('professional_profile_id', $offer->professional_profile_id)
            ->whereIn('status', ['pending_employee', 'planned', 'active', 'trial'])
            ->where('start_at', '<=', $v['end_at'])
            ->where(fn ($q) => $q->whereNull('end_at')->orWhere('end_at', '>=', $v['start_at']))
            ->exists();
        if ($overlap) {
            return response()->json(['message' => 'Ce salarié a déjà une mission sur cette période.', 'code' => 'mission_overlap'], 409);
        }

        return null;
    }

    private function notifyLender(Proposal $proposal, NotificationService $notifications): void
    {
        try {
            $proposal->loadMissing(['proposingCompany', 'toCompany.owner', 'profile.user']);
            $owner = $proposal->toCompany?->owner;
            if (!$owner) return;

            $period = $proposal->start_at && $proposal->end_at
                ? ' du ' . $proposal->start_at->format('d/m/Y') . ' au ' . $proposal->end_at->format('d/m/Y')
                : '';

            $notifications->notify(
                $owner,
                'proposal_received',
                '📩 Nouvelle proposition de collaboration',
                ($proposal->proposingCompany?->name ?? 'Une entreprise') . ' souhaite accueillir '
                . ($proposal->profile?->user?->name ?? 'votre salarié') . $period . '.',
                $proposal,
                ['url' => "/proposals/{$proposal->id}", 'proposal_id' => $proposal->id]
            );
        } catch (\Throwable $e) {
            \Log::warning('notifyLender failed: ' . $e->getMessage());
        }
    }

    private function authorizeSender(Request $request, Proposal $proposal): void
    {
        abort_unless(
            !empty($proposal->proposed_by_company_id)
            && $request->user()->companies()->where('companies.id', $proposal->proposed_by_company_id)->exists(),
            403,
            "Vous n'êtes pas autorisé à modifier cette proposition."
        );
    }

    private function present(Proposal $p): Proposal
    {
        return $p->load(['profile.user', 'proposingCompany', 'toCompany', 'resourceOffer'])
            ->append(['display_status', 'status_label', 'days_until_expiry', 'is_pending']);
    }
}