<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'documentable_type' => ['required', 'in:proposal,mission'],
            'documentable_id' => ['required', 'integer'],
            'type' => ['required', 'in:contract,agreement,attachment,other'],
            'file_path' => ['required', 'string'],
        ]);

        $map = ['proposal' => \App\Models\Proposal::class, 'mission' => \App\Models\Mission::class];

        $document = Document::create([
            'documentable_type' => $map[$data['documentable_type']],
            'documentable_id' => $data['documentable_id'],
            'uploaded_by' => $request->user()->id,
            'type' => $data['type'],
            'file_path' => $data['file_path'],
            'status' => 'draft',
        ]);

        return response()->json($document, 201);
    }

    public function index(Request $request)
    {
        $data = $request->validate([
            'documentable_type' => ['required', 'in:proposal,mission'],
            'documentable_id' => ['required', 'integer'],
        ]);

        $map = ['proposal' => \App\Models\Proposal::class, 'mission' => \App\Models\Mission::class];

        return Document::where('documentable_type', $map[$data['documentable_type']])
            ->where('documentable_id', $data['documentable_id'])
            ->with('uploader:id,name')
            ->get();
    }
}