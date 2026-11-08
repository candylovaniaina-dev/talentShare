<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mission;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class RatingController extends Controller
{
    public function store(Request $request, Mission $mission, NotificationService $notifications)
    {
        abort_unless($mission->status === 'completed', 422, 'La mission doit être terminée pour être évaluée.');

        $companyIds = $request->user()->companies()->pluck('id');
        
        // ✅ On vérifie les deux côtés (demandeur ET fournisseur)
        $isRequestingCompany = $companyIds->contains($mission->requesting_company_id);
        $isSupplyingCompany = $companyIds->contains($mission->supplying_company_id);
        $isCompanySide = $isRequestingCompany || $isSupplyingCompany;

        $isTalentSide = $mission->profile?->user_id === $request->user()->id;

        abort_unless($isCompanySide || $isTalentSide, 403, "Vous n'êtes pas autorisé à évaluer cette mission.");

        // ✅ Vérifier qu'il n'a pas déjà noté
        if ($mission->ratings()->where('rated_by', $request->user()->id)->exists()) {
            return response()->json(['message' => 'Vous avez déjà évalué cette mission.'], 409);
        }

        $data = $request->validate([
            'skills_score' => ['required', 'integer', 'min:1', 'max:5'],
            'quality_score' => ['required', 'integer', 'min:1', 'max:5'],
            'communication_score' => ['required', 'integer', 'min:1', 'max:5'],
            'punctuality_score' => ['required', 'integer', 'min:1', 'max:5'],
            'collaboration_score' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $data['mission_id'] = $mission->id;
        $data['rated_by'] = $request->user()->id;
        $data['rater_role'] = $isCompanySide ? 'company' : 'talent';

        $rating = $mission->ratings()->create($data);

        // 🔔 Notification à la personne évaluée
        try {
            $targetUser = $isCompanySide 
                ? $mission->profile?->user 
                : ($mission->requestingCompany?->owner ?? $mission->supplyingCompany?->owner);

            if ($targetUser) {
                $notifications->notify(
                    $targetUser,
                    'new_rating',
                    '⭐ Nouvelle évaluation reçue',
                    "Vous avez reçu une évaluation pour la mission « " . ($mission->title ?? 'Mission') . " ».",
                    $mission,
                    ['url' => "/missions/{$mission->id}", 'mission_id' => $mission->id]
                );
            }
        } catch (\Exception $e) {
            \Log::warning('Notification failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Évaluation enregistrée avec succès ✅',
            'rating' => $rating
        ], 201);
    }

 public function index(Mission $mission)
{
    return response()->json([
        'data' => $mission->ratings()->with('rater:id,name')->get()
    ]);
}
        /**
     * ✅ Récupérer les évaluations reçues par un utilisateur
     * (pour afficher sur son profil ou sur la fiche entreprise)
     */
    public function receivedByUser(Request $request, $userId)
    {
        // On récupère les évaluations où l'utilisateur est la cible
        // On déduit la cible via la mission
        $ratings = Rating::where(function ($q) use ($userId) {
            // Si le rater était une entreprise, la cible est le talent de la mission
            $q->where('rater_role', 'company')
              ->whereHas('mission.profile', function ($sub) use ($userId) {
                  $sub->where('user_id', $userId);
              });
        })->orWhere(function ($q) use ($userId) {
            // Si le rater était un talent, la cible est l'owner de l'entreprise de la mission
            $q->where('rater_role', 'talent')
              ->whereHas('mission', function ($sub) use ($userId) {
                  $sub->whereHas('requestingCompany', function ($c) use ($userId) {
                      $c->where('owner_user_id', $userId);
                  })->orWhereHas('supplyingCompany', function ($c) use ($userId) {
                      $c->where('owner_user_id', $userId);
                  });
              });
        })->with(['rater:id,name', 'mission:id,title'])->latest()->get();

        // Calculer la moyenne globale
        $avg = $ratings->avg(function ($r) {
            return ($r->skills_score + $r->quality_score + $r->communication_score + $r->punctuality_score + $r->collaboration_score) / 5;
        });

        return response()->json([
            'data' => $ratings,
            'average' => round($avg ?? 0, 1),
            'count' => $ratings->count(),
        ]);
    }
}