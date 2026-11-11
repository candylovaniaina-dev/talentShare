<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentVersion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use App\Models\Application;
use App\Models\Mission;
use App\Models\Proposal;

class DocumentController extends Controller
{
    const DOCUMENT_TYPES = ['contract', 'agreement', 'invoice', 'quote', 'attachment', 'other'];
    const DOCUMENT_STATUSES = ['draft', 'pending', 'signed', 'expired', 'cancelled'];

    public function index(Request $request)
    {
        $user = $request->user();

        $query = Document::query()
            ->with(['uploader:id,name,email,avatar_path', 'currentVersionFile']);

        if ($request->filled('documentable_type') && $request->filled('documentable_id')) {
            $type = str_replace('\\\\', '\\', $request->documentable_type);

            if ($type === 'proposal') $type = \App\Models\Proposal::class;
            if ($type === 'mission')  $type = \App\Models\Mission::class;

            abort_unless(
                in_array($type, [\App\Models\Mission::class, \App\Models\Proposal::class], true),
                422,
                'Type de ressource non supporté.'
            );
            
            $this->authorizeDocumentableRead($request, $type, (int) $request->documentable_id);

            $query->where('documentable_type', $type)
                  ->where('documentable_id', $request->documentable_id);
        } else {
            $query->where('uploaded_by', $user->id);
        }

        if ($request->has('document_type')) {
            $query->where('document_type', $request->document_type);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return $query->latest()->get();
    }

    public function upload(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => [
                'required', 'file', 'max:10240',
                'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,webp,txt',
            ],
            'documentable_type' => ['required', 'string'],
            'documentable_id' => ['required', 'integer'],
            'document_type' => ['required', 'string', 'in:' . implode(',', self::DOCUMENT_TYPES)],
            'status' => ['nullable', 'string', 'in:' . implode(',', self::DOCUMENT_STATUSES)],
            'expires_at' => ['nullable', 'date', 'after:now'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['documentable_type'] = str_replace('\\\\', '\\', $data['documentable_type']);

        $typeMap = [
            'proposal' => \App\Models\Proposal::class,
            'mission' => \App\Models\Mission::class,
            'application' => \App\Models\Application::class,
        ];
        
        if (isset($typeMap[$data['documentable_type']])) {
            $data['documentable_type'] = $typeMap[$data['documentable_type']];
        }

        $this->authorizeDocumentable($request, $data['documentable_type'], $data['documentable_id']);

        $file = $request->file('file');
        $path = $file->store('documents/' . date('Y/m'), 'public');

        $document = Document::create([
            'documentable_type' => $data['documentable_type'],
            'documentable_id' => $data['documentable_id'],
            'type' => $data['document_type'],
            'document_type' => $data['document_type'],
            'status' => $data['status'] ?? 'draft',
            'file_path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'current_version' => 1,
            'expires_at' => $data['expires_at'] ?? null,
            'notes' => $data['notes'] ?? null,
            'uploaded_by' => $request->user()->id,
        ]);

        $document->versions()->create([
            'version_number' => 1,
            'file_path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'uploaded_by' => $request->user()->id,
        ]);

        $document->logHistory('created', null, null, "Document uploadé : {$file->getClientOriginalName()}");

        return response()->json([
            'message' => 'Document uploadé avec succès',
            'document' => $document->load(['uploader:id,name,email', 'currentVersionFile']),
        ], 201);
    }

    public function show(Request $request, Document $document)
    {
        $this->authorizeDocumentAccess($request, $document);

        return $document->load([
            'uploader:id,name,email,avatar_path',
            'signedBy:id,name,email',
            'versions.uploader:id,name,email',
            'history.user:id,name,email',
        ]);
    }

    public function update(Request $request, Document $document)
    {
        $this->authorizeDocumentAccess($request, $document);

        $data = $request->validate([
            'document_type' => ['sometimes', 'string', 'in:' . implode(',', self::DOCUMENT_TYPES)],
            'status' => ['sometimes', 'string', 'in:' . implode(',', self::DOCUMENT_STATUSES)],
            'expires_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $old = $document->only(array_keys($data));
        $document->update($data);

        foreach ($data as $key => $value) {
            if (($old[$key] ?? null) != $value) {
                $document->logHistory(
                    $key === 'status' ? 'status_changed' : 'updated',
                    $old[$key] ?? null,
                    is_string($value) ? $value : json_encode($value),
                    "Champ modifié : {$key}"
                );
            }
        }

        return response()->json([
            'message' => 'Document mis à jour',
            'document' => $document->fresh(['uploader', 'currentVersionFile']),
        ]);
    }

    public function uploadVersion(Request $request, Document $document)
    {
        $this->authorizeDocumentAccess($request, $document);

        $request->validate([
            'file' => [
                'required', 'file', 'max:10240',
                'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,webp,txt',
            ],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $file = $request->file('file');
        $path = $file->store('documents/' . date('Y/m'), 'public');

        $version = $document->addVersion(
            $path,
            $file->getClientOriginalName(),
            $file->getMimeType(),
            $file->getSize()
        );

        if ($request->filled('notes')) {
            $version->update(['notes' => $request->notes]);
        }

        return response()->json([
            'message' => 'Nouvelle version ajoutée',
            'document' => $document->fresh(['versions.uploader']),
            'version' => $version,
        ], 201);
    }

    public function markAsSigned(Request $request, Document $document)
    {
        $this->authorizeDocumentAccess($request, $document);

        if ($document->status === 'signed') {
            return response()->json(['message' => 'Déjà signé'], 409);
        }

        $oldStatus = $document->status;
        $document->update([
            'status' => 'signed',
            'signed_at' => now(),
            'signed_by' => $request->user()->id,
        ]);

        $document->logHistory('signed', $oldStatus, 'signed', 'Document marqué comme signé');

        return response()->json([
            'message' => 'Document signé',
            'document' => $document->fresh(['signedBy']),
        ]);
    }

    public function download(Request $request, Document $document)
    {
        $this->authorizeDocumentAccess($request, $document);

        $document->logHistory('downloaded', null, null, 'Téléchargement');

        $path = storage_path('app/public/' . $document->file_path);
        if (!file_exists($path)) {
            return response()->json(['message' => 'Fichier introuvable'], 404);
        }

        return response()->download($path, $document->original_name);
    }

    public function downloadVersion(Request $request, Document $document, DocumentVersion $version)
    {
        $this->authorizeDocumentAccess($request, $document);
        abort_unless($version->document_id === $document->id, 404);

        $path = storage_path('app/public/' . $version->file_path);
        if (!file_exists($path)) {
            return response()->json(['message' => 'Fichier introuvable'], 404);
        }

        return response()->download($path, $version->original_name);
    }

    public function history(Request $request, Document $document)
    {
        $this->authorizeDocumentAccess($request, $document);

        return $document->history()->with('user:id,name,email,avatar_path')->get();
    }

    public function destroy(Request $request, Document $document)
    {
        $this->authorizeDocumentAccess($request, $document);

        abort_unless(
            (int) $document->uploaded_by === (int) $request->user()->id,
            403,
            'Seule la personne qui a ajouté ce document peut le supprimer.'
        );

        $document->logHistory('deleted', null, null, 'Document supprimé');
        $document->delete();

        return response()->json(['message' => 'Document supprimé']);
    }

    /** Rôle de l'utilisateur sur une proposition : sender | recipient | talent | null */
    private function proposalRole(Proposal $proposal, array $companyIds, ?int $profileId): ?string
    {
        $proposal->loadMissing('resourceRequest');

        if ($proposal->proposed_by_company_id && in_array($proposal->proposed_by_company_id, $companyIds)) {
            return 'sender';
        }

        $requestCompanyId = $proposal->resourceRequest?->company_id;
        if (
            ($proposal->to_company_id && in_array($proposal->to_company_id, $companyIds))
            || ($requestCompanyId && in_array($requestCompanyId, $companyIds))
        ) {
            return 'recipient';
        }

        if ($profileId && (int) $proposal->professional_profile_id === (int) $profileId) {
            return 'talent';
        }

        return null;
    }

    private function authorizeDocumentAccess(Request $request, Document $document): void
    {
        $user = $request->user();

        if ((int) $document->uploaded_by === (int) $user->id) return;

        $companyIds = $user->companies()->pluck('id')->toArray();
        $profileId  = $user->professionalProfile?->id;
        $target     = $document->documentable;

        if ($target instanceof Mission) {
            if (
                (int) $target->professional_profile_id === (int) $profileId
                || in_array($target->supplying_company_id, $companyIds)
                || in_array($target->requesting_company_id, $companyIds)
            ) return;
        }

        if ($target instanceof Proposal && $this->proposalRole($target, $companyIds, $profileId)) {
            return;
        }

        abort(403, 'Accès refusé à ce document.');
    }

    private function authorizeDocumentable(Request $request, string $type, int $id): void
    {
        abort_unless(
            in_array($type, [Mission::class, Proposal::class, Application::class], true),
            422,
            'Type de ressource non supporté.'
        );

        $model = $type::find($id);
        abort_unless($model, 404, 'Ressource introuvable.');

        $user       = $request->user();
        $companyIds = $user->companies()->pluck('id')->toArray();
        $profileId  = $user->professionalProfile?->id;

        if ($model instanceof Mission) {
            abort_unless(
                (int) $model->professional_profile_id === (int) $profileId
                || in_array($model->supplying_company_id, $companyIds)
                || in_array($model->requesting_company_id, $companyIds),
                403,
                "Vous n'êtes pas autorisé à ajouter des documents à cette mission."
            );
        } elseif ($model instanceof Proposal) {
            abort_unless(
                in_array($this->proposalRole($model, $companyIds, $profileId), ['sender', 'recipient'], true),
                403,
                'Seules les entreprises concernées peuvent ajouter des documents à cette proposition.'
            );
        } else {
            $model->loadMissing('jobOffer');
            $isApplicant = $profileId && (int) $model->professional_profile_id === (int) $profileId;
            $isRecruiter = $model->jobOffer && in_array($model->jobOffer->company_id, $companyIds);

            abort_unless(
                $isApplicant || $isRecruiter,
                403,
                "Vous n'êtes pas autorisé à ajouter des documents à cette candidature."
            );
        }
    }

    // ✅ C'EST ICI QUE LE BUG ÉTAIT (La lecture des documents par les collaborateurs)
    private function authorizeDocumentableRead(Request $request, string $type, int $id): void
    {
        $model = $type::find($id);
        abort_unless($model, 404, 'Ressource introuvable.');

        $user       = $request->user();
        $companyIds = $user->companies()->pluck('id')->toArray();
        $profileId  = $user->professionalProfile?->id;

        $allowed = false;

        if ($model instanceof Mission) {
            // 1. Est-ce le créateur de la mission ?
            $isMainOwner = (int) $model->professional_profile_id === (int) $profileId;
            
            // 2. Est-ce l'entreprise ?
            $isCompany = in_array($model->supplying_company_id, $companyIds) || in_array($model->requesting_company_id, $companyIds);

            // 3. Est-ce un collaborateur (rattaché à la même proposition) ?
            $isCollaborator = false;
            $requestId = $model->proposal?->resource_request_id;
            if ($requestId && $profileId) {
                $isCollaborator = Mission::whereHas('proposal', function ($q) use ($requestId) {
                        $q->where('resource_request_id', $requestId);
                    })
                    ->where('professional_profile_id', $profileId)
                    ->exists();
            }

            $allowed = $isMainOwner || $isCompany || $isCollaborator;

        } elseif ($model instanceof Proposal) {
            // Vérifier si c'est le talent de la proposition
            $isTalent = $profileId && (int) $model->professional_profile_id === (int) $profileId;
            // Vérifier les entreprises
            $isCompany = (bool) $this->proposalRole($model, $companyIds, $profileId);

            $allowed = $isTalent || $isCompany;
        }

        abort_unless($allowed, 403, 'Accès refusé à ces documents.');
    }
}