<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Mission;
use App\Models\Proposal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    /**
     * ✅ Upload d'un document sur une Proposition ou Mission
     * POST /documents/upload
     */
    public function upload(Request $request)
    {
        $data = $request->validate([
            'documentable_type' => ['required', 'in:proposal,mission'],
            'documentable_id'   => ['required', 'integer'],
            'type'              => ['required', 'in:contract,agreement,attachment,other'],
            'file'              => ['required', 'file', 'max:10240', 'mimes:pdf,doc,docx,png,jpg,jpeg,webp'],
        ]);

        $map = [
            'proposal' => Proposal::class,
            'mission'  => Mission::class,
        ];

        $modelClass = $map[$data['documentable_type']];

        // ✅ Vérifier que le parent existe
        $parent = $modelClass::find($data['documentable_id']);
        if (!$parent) {
            return response()->json(['message' => 'Élément parent introuvable.'], 404);
        }

        // ✅ Autorisation : le user doit être lié
        $user = $request->user();
        $companyIds = $user->companies()->pluck('id')->toArray();

        if ($data['documentable_type'] === 'proposal') {
            $allowed = in_array($parent->proposed_by_company_id, $companyIds)
                || in_array($parent->to_company_id, $companyIds)
                || ($user->professionalProfile && $user->professionalProfile->id === $parent->professional_profile_id);

            if (!$allowed) {
                return response()->json(['message' => 'Non autorisé à ajouter un document.'], 403);
            }
        }

        // ✅ Stocker le fichier
        $folder = "documents/{$data['documentable_type']}s/{$data['documentable_id']}";
        $path = $request->file('file')->store($folder, 'public');

        // ✅ Créer le Document
        $document = Document::create([
            'documentable_type' => $modelClass,
            'documentable_id'   => $data['documentable_id'],
            'uploaded_by'       => $user->id,
            'type'              => $data['type'],
            'file_path'         => $path,
            'original_name'     => $request->file('file')->getClientOriginalName(),
            'mime_type'         => $request->file('file')->getMimeType(),
            'size'              => $request->file('file')->getSize(),
            'status'            => 'draft',
        ]);

        return response()->json($document->load('uploader:id,name'), 201);
    }

    /**
     * ✅ Liste des documents d'un parent
     * GET /documents?documentable_type=proposal&documentable_id=1
     */
    public function index(Request $request)
    {
        $data = $request->validate([
            'documentable_type' => ['required', 'in:proposal,mission'],
            'documentable_id'   => ['required', 'integer'],
        ]);

        $map = [
            'proposal' => Proposal::class,
            'mission'  => Mission::class,
        ];

        return Document::where('documentable_type', $map[$data['documentable_type']])
            ->where('documentable_id', $data['documentable_id'])
            ->with('uploader:id,name')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($d) {
                $d->append(['file_url', 'formatted_size']);
                return $d;
            });
    }

    /**
     * ✅ Télécharger un document
     * GET /documents/{id}/download
     */
    public function download(Request $request, Document $document)
    {
        // Vérifier l'autorisation
        $user = $request->user();

        if ($document->documentable_type === Proposal::class) {
            $proposal = $document->documentable;
            $companyIds = $user->companies()->pluck('id')->toArray();

            $allowed = in_array($proposal->proposed_by_company_id, $companyIds)
                || in_array($proposal->to_company_id, $companyIds)
                || ($user->professionalProfile && $user->professionalProfile->id === $proposal->professional_profile_id);

            if (!$allowed) {
                abort(403, 'Non autorisé.');
            }
        }

        if (!Storage::disk('public')->exists($document->file_path)) {
            return response()->json(['message' => 'Fichier introuvable.'], 404);
        }

        return Storage::disk('public')->download(
            $document->file_path,
            $document->original_name ?? basename($document->file_path)
        );
    }

    /**
     * ✅ Supprimer un document
     * DELETE /documents/{id}
     */
    public function destroy(Request $request, Document $document)
    {
        $user = $request->user();

        // Seul l'uploader ou un admin peut supprimer
        if ($document->uploaded_by !== $user->id && !$user->isAdmin()) {
            abort(403, 'Non autorisé.');
        }

        // Supprimer le fichier physique
        if (Storage::disk('public')->exists($document->file_path)) {
            Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();

        return response()->json(['message' => 'Document supprimé.']);
    }

    /**
     * ⚠️ Méthode legacy (store) — conservée pour compatibilité
     */
    public function store(Request $request)
    {
        return $this->upload($request);
    }
}