<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProfessionalProfile;
use App\Models\ResourceOffer;
use App\Models\ResourceRequest;
use App\Services\MatchingService;
use Illuminate\Http\Request;

class MatchController extends Controller
{
    /**
     * ✅ Expliquer le score de match entre :
     * - Un profil et une ResourceRequest (mode = profile_request)
     * - Un profil et une ResourceOffer (mode = profile_offer)
     * - Un profil et des critères de recherche (mode = search)
     */
    public function explain(Request $request, MatchingService $matcher)
    {
        $data = $request->validate([
            'mode' => ['required', 'in:profile_request,profile_offer,search'],
            'profile_id' => ['required', 'exists:professional_profiles,id'],
            'request_id' => ['required_if:mode,profile_request', 'nullable', 'exists:resource_requests,id'],
            'offer_id' => ['required_if:mode,profile_offer', 'nullable', 'exists:resource_offers,id'],
            'criteria' => ['nullable', 'array'],
        ]);

        $profile = ProfessionalProfile::with([
            'user:id,name',
            'skills',
            'availabilityWindows',
        ])->findOrFail($data['profile_id']);

        if ($data['mode'] === 'profile_request') {
            $resourceRequest = ResourceRequest::with('skills')->findOrFail($data['request_id']);
            $result = $matcher->score($resourceRequest, $profile);
            $target = [
                'type' => 'request',
                'id' => $resourceRequest->id,
                'title' => $resourceRequest->title,
            ];
            $explanation = $this->explainProfileRequest($resourceRequest, $profile, $result);
        } elseif ($data['mode'] === 'profile_offer') {
            $offer = ResourceOffer::with('skills')->findOrFail($data['offer_id']);
            $result = $matcher->scoreSearch($profile, ['_offer' => $offer], null, 'profile');
            $target = [
                'type' => 'offer',
                'id' => $offer->id,
                'title' => $offer->title,
            ];
            $explanation = [];
        } else {
            // Mode search : critères libres
            $criteria = $data['criteria'] ?? [];
            $score = $matcher->scoreSearch($profile, $criteria, null, 'profile');
            $result = [
                'total' => $score,
                'breakdown' => [],
            ];
            $target = null;
            $explanation = $this->explainSearch($profile, $criteria);
        }

        return response()->json([
            'profile' => [
                'id' => $profile->id,
                'name' => $profile->user->name,
                'headline' => $profile->headline,
            ],
            'target' => $target,
            'total' => $result['total'],
            'breakdown' => $result['breakdown'] ?? [],
            'explanation' => $explanation,
        ]);
    }

    /**
     * ✅ Génère les phrases explicatives pour un match profil × demande
     */
    private function explainProfileRequest(ResourceRequest $req, ProfessionalProfile $profile, array $result): array
    {
        $explanation = [];
        $breakdown = $result['breakdown'] ?? [];

        // === COMPÉTENCES ===
        $required = $req->skills;
        $owned = $profile->skills->keyBy('id');

        $matched = [];
        $missing = [];
        $levelMismatch = [];

        $levels = ['beginner' => 1, 'intermediate' => 2, 'advanced' => 3, 'expert' => 4];

        foreach ($required as $skill) {
            $profileSkill = $owned->get($skill->id);
            if (!$profileSkill) {
                $missing[] = $skill->name;
                continue;
            }

            $reqLevel = $levels[$skill->pivot->min_level] ?? 2;
            $ownLevel = $levels[$profileSkill->pivot->level] ?? 1;

            if ($ownLevel >= $reqLevel) {
                $matched[] = $skill->name;
            } else {
                $levelMismatch[] = [
                    'name' => $skill->name,
                    'required' => $skill->pivot->min_level,
                    'owned' => $profileSkill->pivot->level,
                ];
            }
        }

        if (count($matched) === $required->count()) {
            $explanation[] = [
                'type' => 'success',
                'icon' => '✅',
                'label' => "Vous avez les {$required->count()} compétences requises",
            ];
        } else {
            if (!empty($matched)) {
                $explanation[] = [
                    'type' => 'success',
                    'icon' => '✅',
                    'label' => "Vous avez " . count($matched) . "/{$required->count()} compétences : " . implode(', ', array_slice($matched, 0, 5)),
                ];
            }
            if (!empty($missing)) {
                $explanation[] = [
                    'type' => 'error',
                    'icon' => '❌',
                    'label' => "Compétences manquantes : " . implode(', ', $missing),
                ];
            }
            if (!empty($levelMismatch)) {
                foreach ($levelMismatch as $lm) {
                    $explanation[] = [
                        'type' => 'warning',
                        'icon' => '⚠️',
                        'label' => "{$lm['name']} : niveau {$lm['owned']} (requis : {$lm['required']})",
                    ];
                }
            }
        }

        // === DISPONIBILITÉ ===
        if (($breakdown['availability'] ?? 0) >= 100) {
            $explanation[] = [
                'type' => 'success',
                'icon' => '✅',
                'label' => 'Disponible sur toute la période demandée',
            ];
        } else {
            $explanation[] = [
                'type' => 'error',
                'icon' => '❌',
                'label' => 'Pas de disponibilité qui chevauche la période',
            ];
        }

        // === LOCALISATION ===
        if (($breakdown['location'] ?? 0) >= 100) {
            $explanation[] = [
                'type' => 'success',
                'icon' => '✅',
                'label' => "Même ville : {$profile->city}",
            ];
        } elseif (($breakdown['location'] ?? 0) >= 70) {
            $explanation[] = [
                'type' => 'success',
                'icon' => '✅',
                'label' => "Même pays : {$profile->country}",
            ];
        } elseif ($profile->city && $req->city) {
            $explanation[] = [
                'type' => 'warning',
                'icon' => '⚠️',
                'label' => "Ville différente : {$profile->city} (demandé : {$req->city})",
            ];
        }

        // === TÉLÉTRAVAIL ===
        if (($breakdown['remote'] ?? 0) >= 100) {
            if ($req->remote) {
                $explanation[] = [
                    'type' => 'success',
                    'icon' => '✅',
                    'label' => 'Télétravail compatible',
                ];
            } else {
                $explanation[] = [
                    'type' => 'success',
                    'icon' => '✅',
                    'label' => 'Sur site — pas de contrainte télétravail',
                ];
            }
        }

        return $explanation;
    }

    /**
     * ✅ Explication pour le mode recherche (critères libres)
     */
    private function explainSearch(ProfessionalProfile $profile, array $criteria): array
    {
        $explanation = [];

        if (!empty($criteria['skill_ids'])) {
            $count = count($criteria['skill_ids']);
            $explanation[] = [
                'type' => 'info',
                'icon' => '🎯',
                'label' => "{$count} compétence(s) recherchée(s)",
            ];
        }

        if (!empty($criteria['min_level'])) {
            $explanation[] = [
                'type' => 'info',
                'icon' => '📘',
                'label' => "Niveau minimum : {$criteria['min_level']}",
            ];
        }

        if (!empty($criteria['city'])) {
            $explanation[] = [
                'type' => 'info',
                'icon' => '📍',
                'label' => "Ville recherchée : {$criteria['city']}",
            ];
        }

        if (!empty($criteria['verified_only'])) {
            $explanation[] = [
                'type' => $profile->is_verified ? 'success' : 'warning',
                'icon' => $profile->is_verified ? '✅' : '⚠️',
                'label' => $profile->is_verified ? 'Profil vérifié' : 'Profil non vérifié',
            ];
        }

        return $explanation;
    }
}