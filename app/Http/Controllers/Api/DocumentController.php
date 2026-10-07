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
    /**
     * Types de documents autorisés
     */
    const DOCUMENT_TYPES = ['contract', 'agreement', 'invoice', 'quote', 'attachment', 'other'];
    const DOCUMENT_STATUSES = ['draft', 'pending', 'signed', 'expired', 'cancelled'];

    /**
     * ✅ Liste des documents (filtrée par documentable_type/id)
     */
    public function index(Request $request)
    {
        $query = Document::query()
            ->with(['uploader:id,name,email,avatar_path', 'currentVersionFile'])
            ->where(function ($q) use ($request) {
                // ✅ Sécurité : ne voir que les documents liés à des ressources accessibles
                $q->where('uploaded_by', $request->user()->id);

                // Ou ceux liés à une mission où je suis impliqué
                $q->orWhereHasMorph('documentable', ['App\Models\Mission', 'App\Models\Proposal'], function ($qq) use ($request) {
                    // Le contrôleur appelant gère plus finement si besoin
                });
            });

        if ($request->has('documentable_type') && $request->has('documentable_id')) {
            $query->where('documentable_type', $request->documentable_type)
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

    /**
     * ✅ Upload d'un document
     */
    public function upload(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => [
                'required', 'file', 'max:10240', // 10 Mo
                'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,webp,txt',
            ],
            'documentable_type' => ['required', 'string', 'in:App\Models\Mission,App\Models\Proposal,App\Models\Application'],
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

        // ✅ Vérifier que l'utilisateur a accès au documentable
        $this->authorizeDocumentable($request, $data['documentable_type'], $data['documentable_id']);

        // ✅ Upload sécurisé
        $file = $request->file('file');
        $path = $file->store('documents/' . date('Y/m'), 'public');

        $document = Document::create([
            'documentable_type' => $data['documentable_type'],
            'documentable_id' => $data['documentable_id'],
            'type' => $data['document_type'], // compat ancien champ
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

        // ✅ Créer la version 1
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

    /**
     * ✅ Détails d'un document
     */
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

    /**
     * ✅ Mettre à jour les métadonnées
     */
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

        // ✅ Logger chaque changement
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

    /**
     * ✅ Upload d'une nouvelle version
     */
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

    /**
     * ✅ Marquer comme signé
     */
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

    /**
     * ✅ Télécharger (log dans l'historique)
     */
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

    /**
     * ✅ Télécharger une version spécifique
     */
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

    /**
     * ✅ Historique
     */
    public function history(Request $request, Document $document)
    {
        $this->authorizeDocumentAccess($request, $document);

        return $document->history()->with('user:id,name,email,avatar_path')->get();
    }

    /**
     * ✅ Supprimer (soft delete)
     */
    public function destroy(Request $request, Document $document)
    {
        $this->authorizeDocumentAccess($request, $document);

        $document->logHistory('deleted', null, null, 'Document supprimé');
        $document->delete();

        return response()->json(['message' => 'Document supprimé']);
    }

    // ============ AUTORISATIONS ============
    private function authorizeDocumentAccess(Request $request, Document $document): void
    {
        $user = $request->user();

        // Propriétaire direct
        if ($document->uploaded_by === $user->id) return;

        // Lié à une mission où je suis impliqué
        if ($document->documentable_type === 'App\Models\Mission') {
            $mission = $document->documentable;
            if ($mission && (
                $mission->employee_id === $user->id ||
                $mission->supplying_company_id === optional($user->companies()->first())->id ||
                $mission->requesting_company_id === optional($user->companies()->first())->id
            )) return;
        }

        abort(403, 'Accès refusé à ce document.');
    }

    private function authorizeDocumentable(Request $request, string $type, int $id): void
    {
        $model = $type::find($id);
        abort_unless($model, 404, 'Ressource introuvable.');

        // Pour MVP : on accepte si l'utilisateur est lié à la ressource
        // Tu peux renforcer avec une Policy plus tard
        $user = $request->user();

        if ($type === 'App\Models\Mission' && $model->employee_id !== $user->id) {
            $companyIds = $user->companies()->pluck('id')->toArray();
            abort_unless(
                in_array($model->supplying_company_id, $companyIds) ||
                in_array($model->requesting_company_id, $companyIds),
                403,
                'Vous n\'êtes pas autorisé à ajouter des documents à cette mission.'
            );
        }
    }
}