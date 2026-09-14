<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MatchInteraction;
use App\Services\MatchingService;
use Illuminate\Http\Request;

class MatchInteractionController extends Controller
{
    public function store(Request $request, MatchingService $matcher)
    {
        $data = $request->validate([
            'target_type' => ['required', 'in:App\Models\ProfessionalProfile,App\Models\ResourceOffer'],
            'target_id' => ['required', 'integer'],
            'action' => ['required', 'in:viewed,contacted,proposed,accepted,rejected'],
            'match_score_at_action' => ['nullable', 'integer', 'min:0', 'max:100'],
            'search_criteria' => ['nullable', 'array'],
        ]);

        $interaction = MatchInteraction::create([
            'user_id' => $request->user()->id,
            'target_type' => $data['target_type'],
            'target_id' => $data['target_id'],
            'action' => $data['action'],
            'match_score_at_action' => $data['match_score_at_action'] ?? null,
            'search_criteria' => $data['search_criteria'] ?? null,
        ]);

        // ✅ Apprentissage automatique
        $matcher->learnFromInteraction($interaction);

        return response()->json($interaction, 201);
    }
}