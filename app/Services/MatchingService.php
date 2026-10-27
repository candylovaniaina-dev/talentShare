<?php

namespace App\Services;

use App\Models\ProfessionalProfile;
use App\Models\ResourceRequest;
use App\Models\MatchWeight;
use App\Models\MatchInteraction;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class MatchingService
{
    private const LEVEL_ORDER = ['beginner' => 1, 'intermediate' => 2, 'advanced' => 3, 'expert' => 4];

    // ============================================
    // 1️⃣ MÉTHODES POUR ResourceRequest
    // ============================================

    public function score(ResourceRequest $request, ProfessionalProfile $profile): array
    {
        $requiredSkills = $request->skills;
        $profileSkills = $profile->skills->keyBy('id');

        $skillScore = $this->skillScore($requiredSkills, $profileSkills);
        $availabilityScore = $this->availabilityScore($request, $profile);
        $locationScore = $this->locationScore($request, $profile);
        $remoteScore = $request->remote && $profile->availabilityWindows()
            ->where('remote', true)->exists() ? 100 : ($request->remote ? 0 : 100);

        $total = round(
            $skillScore * 0.5 + $availabilityScore * 0.25 + $locationScore * 0.15 + $remoteScore * 0.1
        );

        return [
            'total' => (int) $total,
            'breakdown' => [
                'skills' => (int) $skillScore,
                'availability' => (int) $availabilityScore,
                'location' => (int) $locationScore,
                'remote' => (int) $remoteScore,
            ],
        ];
    }

       /**
     * ✅ Score par compétences avec matching FUZZY (tolérant)
     */
    private function skillScore(Collection $required, Collection $profileSkills): float
    {
        if ($required->isEmpty()) return 100;

        $matched = 0;
        $matchDetails = [];

        foreach ($required as $skill) {
            // 1. Match exact par ID
            $owned = $profileSkills->get($skill->id);
            if ($owned) {
                $requiredLevel = self::LEVEL_ORDER[$skill->pivot->min_level] ?? 2;
                $ownedLevel = self::LEVEL_ORDER[$owned->pivot->level] ?? 1;
                $matched += $ownedLevel >= $requiredLevel ? 1 : 0.5;
                $matchDetails[] = ['exact', $skill->name];
                continue;
            }

            // 2. Match fuzzy par nom (si pas d'ID exact)
            $bestMatch = $this->findFuzzySkillMatch($skill->name, $profileSkills);

            if ($bestMatch) {
                $similarity = $bestMatch['similarity'];

                if ($similarity >= 0.85) {
                    // Très similaire → score plein
                    $matched += 1;
                    $matchDetails[] = ['alias', $skill->name . ' → ' . $bestMatch['name'], $similarity];
                } elseif ($similarity >= 0.6) {
                    // Partiellement similaire → 70%
                    $matched += 0.7;
                    $matchDetails[] = ['partial', $skill->name . ' ≈ ' . $bestMatch['name'], $similarity];
                }
            }
        }

        return ($matched / $required->count()) * 100;
    }

    /**
     * ✅ Cherche la meilleure correspondance fuzzy pour un nom de skill
     */
        private function findFuzzySkillMatch(string $requiredName, Collection $profileSkills): ?array
    {
        $requiredNorm = $this->normalizeSkillName($requiredName);
        if (empty($requiredNorm)) return null;

        // ✅ Étape 1 : Cherche dans les ALIAS en base
        $aliasMatch = \DB::table('skill_aliases')
            ->join('skills', 'skill_aliases.skill_id', '=', 'skills.id')
            ->where('skill_aliases.alias_slug', \Str::slug($requiredName))
            ->first();

        if ($aliasMatch) {
            // Le skill canonique existe peut-être dans le profil
            $owned = $profileSkills->firstWhere('id', $aliasMatch->skill_id);
            if ($owned) {
                return [
                    'name' => $owned->name,
                    'similarity' => 0.95,
                ];
            }
        }

        // ✅ Étape 2 : Fallback sur le fuzzy matching
        $best = null;
        $bestScore = 0;

        foreach ($profileSkills as $profileSkill) {
            $profileNorm = $this->normalizeSkillName($profileSkill->name);
            if (empty($profileNorm)) continue;

            $similarity = $this->calculateSimilarity($requiredNorm, $profileNorm);
            $wordScore = $this->wordOverlapScore($requiredNorm, $profileNorm);
            $finalScore = max($similarity, $wordScore);

            if ($finalScore > $bestScore) {
                $bestScore = $finalScore;
                $best = [
                    'name' => $profileSkill->name,
                    'similarity' => $finalScore,
                ];
            }
        }

        return $bestScore >= 0.5 ? $best : null;
    }

    /**
     * ✅ Normalise un nom de skill (lowercase, sans accents, sans ponctuation)
     */
    private function normalizeSkillName(string $name): string
    {
        // Lowercase
        $name = mb_strtolower($name);

        // Enlève les accents
        $name = iconv('UTF-8', 'ASCII//TRANSLIT', $name);

        // Enlève la ponctuation et caractères spéciaux (sauf espaces et lettres/chiffres)
        $name = preg_replace('/[^a-z0-9\s]/', ' ', $name);

        // Enlève les suffixes techniques courants
        $name = preg_replace('/\b(js|ts|framework|library|\.js|\.ts|api|sdk)\b/', '', $name);

        // Enlève les B2B, B2C, etc.
        $name = preg_replace('/\b(b2b|b2c|b2g|c2c)\b/', '', $name);

        // Remplace les espaces multiples
        $name = preg_replace('/\s+/', ' ', $name);

        return trim($name);
    }

    /**
     * ✅ Calcule la similarité entre 2 chaînes (0 à 1)
     * Utilise similar_text avec % + longueurs
     */
    private function calculateSimilarity(string $a, string $b): float
    {
        if (empty($a) || empty($b)) return 0;

        // similar_text retourne le % de similarité
        similar_text($a, $b, $percent);

        return $percent / 100;
    }

    /**
     * ✅ Compte le % de mots en commun entre 2 chaînes
     */
    private function wordOverlapScore(string $a, string $b): float
    {
        $wordsA = array_filter(explode(' ', $a));
        $wordsB = array_filter(explode(' ', $b));

        if (empty($wordsA) || empty($wordsB)) return 0;

        $common = 0;
        foreach ($wordsA as $wa) {
            // Ignore les mots trop courts
            if (strlen($wa) < 3) continue;

            foreach ($wordsB as $wb) {
                if (strlen($wb) < 3) continue;

                // Match exact de mot OU inclusion (>= 4 car. communs)
                if ($wa === $wb) {
                    $common += 1;
                    break;
                }
                if (strlen($wa) >= 4 && strlen($wb) >= 4 && (
                    str_contains($wa, $wb) || str_contains($wb, $wa)
                )) {
                    $common += 0.7;
                    break;
                }
            }
        }

        $maxWords = max(count($wordsA), count($wordsB));
        return $maxWords > 0 ? $common / $maxWords : 0;
    }

    private function availabilityScore(ResourceRequest $request, ProfessionalProfile $profile): float
    {
        $overlap = $profile->availabilityWindows()
            ->where('status', 'available')
            ->where('start_at', '<=', $request->end_at)
            ->where('end_at', '>=', $request->start_at)
            ->exists();

        return $overlap ? 100 : 0;
    }

    private function locationScore(ResourceRequest $request, ProfessionalProfile $profile): float
    {
        if ($request->remote) return 100;
        if ($request->country && $profile->country === $request->country) {
            return $profile->city === $request->city ? 100 : 70;
        }
        return 30;
    }

    public function rankCandidates(ResourceRequest $request, int $limit = 20): Collection
    {
        return ProfessionalProfile::with('skills', 'user')
            ->where('visibility', '!=', 'private')
            ->get()
            ->map(fn ($profile) => [
                'profile' => $profile,
                'match' => $this->score($request, $profile),
            ])
            ->sortByDesc(fn ($item) => $item['match']['total'])
            ->take($limit)
            ->values();
    }

    // ============================================
    // 2️⃣ MÉTHODES POUR LA RECHERCHE EXPLORE
    // ============================================

    /**
     * ✅ Score de matching — retourne TOUJOURS un score (0-100)
     * Sans filtre → score de complétion du profil
     * Avec filtres → score pondéré
     */
    public function scoreSearch($item, array $criteria, ?int $userId = null, string $type = 'profile'): int
    {
        $hasCriteria = !empty(array_filter($criteria, fn ($v) =>
            !is_null($v) && $v !== '' && $v !== [] && $v !== false
        ));

        // ✅ Pas de filtre → score de qualité
        if (!$hasCriteria) {
            return $type === 'profile'
                ? $this->computeProfileQualityScore($item)
                : $this->computeOfferQualityScore($item);
        }

        // ✅ Filtres actifs → score pondéré
        $weights = $this->getWeights($userId);
        $score = 0;
        $maxScore = 0;

        // === SKILLS ===
        $wantedSkills = $criteria['skill_ids'] ?? [];
        if (!empty($wantedSkills)) {
            $maxScore += $weights['skills'];
            $itemSkillIds = $item->skills->pluck('id')->toArray();
            $matched = count(array_intersect($wantedSkills, $itemSkillIds));
            $ratio = count($wantedSkills) > 0 ? $matched / count($wantedSkills) : 0;

            $levelBonus = 0;
            if ($matched > 0 && !empty($criteria['min_level'])) {
                $levels = ['beginner' => 0.25, 'intermediate' => 0.5, 'advanced' => 0.75, 'expert' => 1.0];
                $minLevelScore = $levels[$criteria['min_level']] ?? 0;
                $matchedLevels = $item->skills
                    ->filter(fn ($s) => in_array($s->id, $wantedSkills))
                    ->map(fn ($s) => $levels[$s->pivot->level] ?? 0.5);
                $avgItemLevel = $matchedLevels->avg() ?? 0.5;
                $levelBonus = $avgItemLevel >= $minLevelScore ? 0.2 : 0;
            }

            $score += min(1, $ratio + $levelBonus) * $weights['skills'];
        }

        // === LOCALISATION ===
        if (!empty($criteria['city'])) {
            $maxScore += $weights['location'];
            if (strtolower($item->city ?? '') === strtolower($criteria['city'])) {
                $score += $weights['location'];
            }
        } elseif (!empty($criteria['country'])) {
            $maxScore += $weights['location'];
            if (strtolower($item->country ?? '') === strtolower($criteria['country'])) {
                $score += $weights['location'] * 0.7;
            }
        }

        if (!empty($criteria['location_type'])) {
            $maxScore += $weights['location'];
            $itemLoc = $item->location_type
                ?? ($item->availabilityWindows->first()->location_type ?? null);
            if ($itemLoc === $criteria['location_type']) {
                $score += $weights['location'];
            }
        }

        // === DISPONIBILITÉ ===
        if (!empty($criteria['available_from']) || !empty($criteria['available_to'])) {
            $maxScore += $weights['availability'];
            $windows = $item->availabilityWindows ?? collect();
            foreach ($windows as $w) {
                $from = $criteria['available_from'] ?? null;
                $to = $criteria['available_to'] ?? null;
                if ((!$from || $w->end_at >= $from) && (!$to || $w->start_at <= $to)) {
                    $score += $weights['availability'];
                    break;
                }
            }
        }

        // === TYPE ===
        if ($type === 'profile' && !empty($criteria['profile_type'])) {
            $maxScore += $weights['profile_type'];
            if ($item->profile_type === $criteria['profile_type']) {
                $score += $weights['profile_type'];
            }
        }
        if ($type === 'offer' && !empty($criteria['mission_type'])) {
            $maxScore += $weights['profile_type'];
            if ($item->mission_type === $criteria['mission_type']) {
                $score += $weights['profile_type'];
            }
        }

        // === VÉRIFIÉ ===
        if (!empty($criteria['verified_only']) && $type === 'profile') {
            $maxScore += $weights['verified'];
            if ($item->is_verified) $score += $weights['verified'];
        }

        // === TAUX ===
        if ($type === 'offer' && (!empty($criteria['rate_min']) || !empty($criteria['rate_max']))) {
            $maxScore += $weights['rate'];
            $rate = $item->daily_rate ?? 0;
            $min = $criteria['rate_min'] ?? 0;
            $max = $criteria['rate_max'] ?? PHP_INT_MAX;
            if ($rate >= $min && $rate <= $max) $score += $weights['rate'];
        }

        return $maxScore > 0 ? min(100, (int) round(($score / $maxScore) * 100)) : 50;
    }

    /**
     * ✅ Score de qualité d'un profil (0-100)
     */
    private function computeProfileQualityScore($profile): int
    {
        $score = 0;
        $maxScore = 0;

        // Photo (15)
        $maxScore += 15;
        if (!empty($profile->avatar_path)) $score += 15;

        // Titre (10)
        $maxScore += 10;
        if (!empty($profile->headline)) $score += 10;

        // Bio (10)
        $maxScore += 10;
        if (!empty($profile->bio)) $score += 10;

        // Ville + pays (5)
        $maxScore += 5;
        if (!empty($profile->city) && !empty($profile->country)) $score += 5;

        // Vérifié (10)
        $maxScore += 10;
        if (!empty($profile->is_verified)) $score += 10;

        // Compétences (20 — max si ≥5)
        $maxScore += 20;
        $skillsCount = $profile->skills?->count() ?? 0;
        $score += min(20, $skillsCount * 4);

        // Disponibilités (15)
        $maxScore += 15;
        $availCount = $profile->availabilityWindows?->count() ?? 0;
        if ($availCount > 0) $score += 15;

        // Liens externes (5)
        $maxScore += 5;
        if ($profile->linkedin_url || $profile->github_url || $profile->portfolio_url) $score += 5;

        // Expériences (5)
        $maxScore += 5;
        if (($profile->experiences?->count() ?? 0) > 0) $score += 5;

        // Formations (5)
        $maxScore += 5;
        if (($profile->educations?->count() ?? 0) > 0) $score += 5;

        return $maxScore > 0 ? min(100, (int) round(($score / $maxScore) * 100)) : 0;
    }

    /**
     * ✅ Score de qualité d'une offre (0-100)
     */
    private function computeOfferQualityScore($offer): int
    {
        $score = 0;
        $maxScore = 0;

        $maxScore += 15;
        if (!empty($offer->title)) $score += 15;

        $maxScore += 20;
        if (!empty($offer->description)) $score += 20;

        $maxScore += 15;
        if (!empty($offer->daily_rate) || !empty($offer->hourly_rate)) $score += 15;

        $maxScore += 20;
        $skillsCount = $offer->skills?->count() ?? 0;
        $score += min(20, $skillsCount * 5);

        $maxScore += 10;
        if (!empty($offer->location_city)) $score += 10;

        $maxScore += 10;
        if (!empty($offer->company?->is_verified)) $score += 10;

        $maxScore += 10;
        if (!empty($offer->start_at) && !empty($offer->end_at)) $score += 10;

        return $maxScore > 0 ? min(100, (int) round(($score / $maxScore) * 100)) : 0;
    }

    public function getWeights(?int $userId): array
    {
        $defaults = [
            'skills' => 40, 'location' => 15, 'availability' => 15,
            'profile_type' => 10, 'verified' => 5, 'rating' => 10, 'rate' => 5,
        ];

        if (!$userId) return $defaults;
        $custom = MatchWeight::where('user_id', $userId)->first();
        if (!$custom) return $defaults;

        return [
            'skills' => $custom->weight_skills,
            'location' => $custom->weight_location,
            'availability' => $custom->weight_availability,
            'profile_type' => $custom->weight_profile_type,
            'verified' => $custom->weight_verified,
            'rating' => $custom->weight_rating,
            'rate' => $custom->weight_rate,
        ];
    }

    public function learnFromInteraction(MatchInteraction $interaction): void
    {
        $weights = MatchWeight::firstOrCreate(
            ['user_id' => $interaction->user_id],
            [
                'weight_skills' => 40, 'weight_location' => 15, 'weight_availability' => 15,
                'weight_profile_type' => 10, 'weight_verified' => 5, 'weight_rating' => 10, 'weight_rate' => 5,
            ]
        );

        $delta = match ($interaction->action) {
            'accepted' => 3, 'proposed' => 2, 'contacted' => 1,
            'viewed' => 0, 'rejected' => -2, default => 0,
        };
        if ($delta === 0) return;

        $criteria = $interaction->search_criteria ?? [];

        DB::transaction(function () use ($weights, $criteria, $delta) {
            if (!empty($criteria['skill_ids'])) {
                $weights->weight_skills = max(10, min(60, $weights->weight_skills + $delta));
            }
            if (!empty($criteria['city']) || !empty($criteria['country'])) {
                $weights->weight_location = max(5, min(30, $weights->weight_location + $delta));
            }
            $weights->save();
        });
    }
}