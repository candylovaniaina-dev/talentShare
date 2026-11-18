<?php

namespace App\Http\Controllers\University;

use Illuminate\Http\Request;

class BroadcastController extends BaseUniversityController
{
    public function index(Request $r)
    {
        $uni = $this->uni($r);
        return response()->json([
            // Retourne les diffusions (à adapter si tu as une table dédiée)
            'broadcasts' => [] 
        ]);
    }

    public function store(Request $r)
    {
        $uni = $this->uni($r);
        
        $data = $r->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|string',
            'program_id' => 'nullable|exists:university_programs,id',
            'description' => 'nullable|string',
            'deadline' => 'nullable|date',
        ]);

        // Logique pour créer la diffusion (ex: créer une UniversityOpportunity)
        $opportunity = $uni->opportunities()->create([
            'title' => $data['title'],
            'type' => $data['type'],
            'program_id' => $data['program_id'] ?: null,
            'description' => $data['description'] ?? null,
            'deadline' => $data['deadline'] ?? null,
            'status' => 'published',
            'created_by' => $r->user()->id,
        ]);

        return response()->json([
            'message' => 'Offre diffusée avec succès',
            'opportunity' => $opportunity
        ], 201);
    }
}