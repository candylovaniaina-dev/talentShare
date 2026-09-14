<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mission;
use Illuminate\Http\Request;

class RatingController extends Controller
{
    public function store(Request $request, Mission $mission)
    {
        abort_unless($mission->status === 'completed', 422, 'La mission doit être terminée pour être évaluée.');

        $companyIds = $request->user()->companies()->pluck('id');
        $isCompanySide = $companyIds->contains($mission->requesting_company_id);
        $isTalentSide = $mission->profile->user_id === $request->user()->id;

        abort_unless($isCompanySide || $isTalentSide, 403);

        $data = $request->validate([
            'skills_score' => ['required', 'integer', 'min:1', 'max:5'],
            'quality_score' => ['required', 'integer', 'min:1', 'max:5'],
            'communication_score' => ['required', 'integer', 'min:1', 'max:5'],
            'punctuality_score' => ['required', 'integer', 'min:1', 'max:5'],
            'collaboration_score' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string'],
        ]);

        $data['mission_id'] = $mission->id;
        $data['rated_by'] = $request->user()->id;
        $data['rater_role'] = $isCompanySide ? 'company' : 'talent';

        $rating = $mission->ratings()->create($data);

        return response()->json($rating, 201);
    }

    public function index(Mission $mission)
    {
        return $mission->ratings()->with('rater:id,name')->get();
    }
}