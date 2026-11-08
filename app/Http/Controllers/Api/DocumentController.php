<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentVersion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class DocumentController extends Controller
{
    const DOCUMENT_TYPES = ['contract', 'agreement', 'invoice', 'quote', 'attachment', 'other'];
    const DOCUMENT_STATUSES = ['draft', 'pending', 'signed', 'expired', 'cancelled'];

    public function index(Request $request)
    {
        $query = Document::query()
            ->with(['uploader:id,name,email,avatar_path', 'currentVersionFile'])
            ->where(function ($q) use ($request) {
                $q->where('uploaded_by', $request->user()->id);
                $q->orWhereHasMorph('documentable', ['App\Models\Mission', 'App\Models\Proposal'], function ($qq) use ($request) {
                });
            });

        if ($request->has('documentable_type') && $request->has('documentable_id')) {
            $type = str_replace('\\\\', '\\', $request->documentable_type);
            
            if ($type === 'proposal') $type = \App\Models\Proposal::class;
            if ($type === 'mission') $type = \App\Models\Mission::class;
            
            $query->where('documentable_type', $type)
                ->where('documentable_id', $request->documentable_id);
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

        $document->logHistory('deleted', null, null, 'Document supprimé');
        $document->delete();

        return response()->json(['message' => 'Document supprimé']);
    }

    private function authorizeDocumentAccess(Request $request, Document $document): void
    {
        $user = $request->user();

        if ($document->uploaded_by === $user->id) return;

        $companyIds = $user->companies()->pluck('id')->toArray();
        $profileId = $user->professionalProfile?->id;

        if ($document->documentable_type === 'App\Models\Mission') {
            $mission = $document->documentable;
            if ($mission && (
                $mission->professional_profile_id === $profileId ||
                in_array($mission->supplying_company_id, $companyIds) ||
                in_array($mission->requesting_company_id, $companyIds)
            )) return;
        }

        if ($document->documentable_type === 'App\Models\Proposal') {
            $proposal = $document->documentable;
            if ($proposal) {
                $isSender = in_array($proposal->proposed_by_company_id, $companyIds);
                $isRecipient = in_array($proposal->to_company_id, $companyIds);
                $isTalent = $proposal->professional_profile_id === $profileId;
                
                if ($isSender || $isRecipient || $isTalent) return;
            }
        }

        abort(403, 'Accès refusé à ce document.');
    }

    private function authorizeDocumentable(Request $request, string $type, int $id): void
    {
        $model = $type::find($id);
        abort_unless($model, 404, 'Ressource introuvable.');

        $user = $request->user();
        $companyIds = $user->companies()->pluck('id')->toArray();
        $profileId = $user->professionalProfile?->id;

        // ✅ SÉCURITÉ POUR LES MISSIONS
        if ($type === 'App\Models\Mission') {
            $isEmployee = $model->professional_profile_id === $profileId;
            $isSupplying = in_array($model->supplying_company_id, $companyIds);
            $isRequesting = in_array($model->requesting_company_id, $companyIds);

            abort_unless(
                $isEmployee || $isSupplying || $isRequesting,
                403,
                'Vous n\'êtes pas autorisé à ajouter des documents à cette mission.'
            );
        }

        // ✅ SÉCURITÉ POUR LES PROPOSITIONS
        if ($type === 'App\Models\Proposal') {
            // 👇 On force l'ajout de document UNIQUEMENT par l'entreprise qui a proposé (Fournisseuse / Sender)
            $isSender = in_array($model->proposed_by_company_id, $companyIds);
            
            // Si tu veux autoriser aussi le talent, ajoute : || $model->professional_profile_id === $profileId
            abort_unless(
                $isSender, 
                403, 
                'Seule l\'entreprise fournisseuse peut ajouter des documents à cette proposition.'
            );
        }
    }
}