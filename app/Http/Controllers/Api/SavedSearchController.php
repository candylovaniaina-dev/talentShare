<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SavedSearch;
use Illuminate\Http\Request;

class SavedSearchController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()->savedSearches()->latest()->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'criteria' => ['required', 'array'],
            'notify_on_match' => ['boolean'],
        ]);

        $search = $request->user()->savedSearches()->create($data);

        return response()->json($search, 201);
    }

    public function update(Request $request, SavedSearch $savedSearch)
    {
        abort_unless($savedSearch->user_id === $request->user()->id, 403);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:180'],
            'criteria' => ['sometimes', 'array'],
            'notify_on_match' => ['boolean'],
        ]);

        $savedSearch->update($data);

        return $savedSearch;
    }

    public function destroy(Request $request, SavedSearch $savedSearch)
    {
        abort_unless($savedSearch->user_id === $request->user()->id, 403);
        $savedSearch->delete();
        return response()->json(['message' => 'Recherche supprimée']);
    }

    public function run(Request $request, SavedSearch $savedSearch)
    {
        abort_unless($savedSearch->user_id === $request->user()->id, 403);

        $savedSearch->update(['last_run_at' => now()]);

        $request->merge($savedSearch->criteria);

        return app(ProfessionalProfileController::class)->search($request);
    }
}