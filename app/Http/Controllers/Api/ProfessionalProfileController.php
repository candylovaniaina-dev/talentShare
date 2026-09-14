<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\ProfessionalProfileRequest;
use App\Models\ProfessionalProfile;
use App\Models\ResourceOffer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfessionalProfileController extends Controller
{
    /**
     * ✅ P0-8 : Recherche avancée (profils + offres) avec matching intelligent
     */
    public function search(Request $request)
    {
        $user = auth('sanctum')->user();
        $myCompanyIds = $user ? $user->companies()->pluck('id')->toArray() : [];

        // === Préparer les tableaux d'IDs ===
        $wantedSkillIds = $request->skill_ids
            ? (is_array($request->skill_ids) ? $request->skill_ids : explode(',', $request->skill_ids))
            : [];

        // ✅ Corrigé : language_names (noms) au lieu de language_ids
        $wantedLanguageNames = $request->language_names
            ? (is_array($request->language_names) ? $request->language_names : explode(',', $request->language_names))
            : [];

        // === Critères passés au MatchingService ===
        $criteria = [
            'skill_ids' => $wantedSkillIds,
            'min_level' => $request->min_level,
            'min_years' => $request->min_years,
            'country' => $request->country,
            'city' => $request->city,
            'location_type' => $request->location_type,
            'available_from' => $request->available_from,
            'available_to' => $request->available_to,
            'profile_type' => $request->profile_type,
            'mission_type' => $request->mission_type,
            'verified_only' => $request->boolean('verified_only'),
            'rate_min' => $request->rate_min,
            'rate_max' => $request->rate_max,
            'language_names' => $wantedLanguageNames,
        ];

        // ============================================
        // 1) PROFILS PROFESSIONNELS
        // ============================================
        $profileQuery = ProfessionalProfile::query()
            ->whereIn('visibility', ['public', 'network', 'private'])
            ->with([
                'user:id,name,first_name,last_name,country,phone,email',
                'skills.category.parent',
                'skills.category',
                'availabilityWindows' => fn ($q) => $q
                    ->where('end_at', '>=', now()->startOfDay())
                    ->orderBy('start_at'),
                'languages',
                'experiences',
                'educations',
            ]);

        // Recherche texte
        $profileQuery->when($request->search, function ($q, $s) {
            $q->where(function ($sq) use ($s) {
                $sq->where('headline', 'ilike', "%{$s}%")
                   ->orWhere('bio', 'ilike', "%{$s}%")
                   ->orWhereHas('user', fn ($uq) => $uq->where('name', 'ilike', "%{$s}%"))
                   ->orWhereHas('skills', fn ($skq) => $skq->where('name', 'ilike', "%{$s}%"));
            });
        });

        // Type de profil
        $profileQuery->when($request->profile_type, fn ($q, $v) => $q->where('profile_type', $v));

        // Pays
        $profileQuery->when($request->country, fn ($q, $v) => $q->where('country', $v));

        // Ville
        $profileQuery->when($request->city, fn ($q, $v) => $q->where('city', 'ilike', "%{$v}%"));

        // Compétences (multi)
        $profileQuery->when($wantedSkillIds, function ($q) use ($wantedSkillIds) {
            $q->whereHas('skills', fn ($sq) => $sq->whereIn('skills.id', $wantedSkillIds));
        });

        // Niveau minimum
        $profileQuery->when($request->min_level, function ($q) use ($request) {
            $levels = ['beginner', 'intermediate', 'advanced', 'expert'];
            $idx = array_search($request->min_level, $levels);
            $acceptedLevels = $idx === false ? $levels : array_slice($levels, $idx);

            $q->whereHas('skills', fn ($sq) => $sq->whereIn('profile_skills.level', $acceptedLevels));
        });

        // Années d'expérience minimum
        $profileQuery->when($request->min_years, function ($q, $y) {
            $q->whereHas('skills', fn ($sq) =>
                $sq->where('profile_skills.years_experience', '>=', (int) $y)
            );
        });

        // Statut de disponibilité
        $profileQuery->when($request->availability_status, function ($q, $s) {
            $q->whereHas('availabilityWindows', fn ($sq) =>
                $sq->where('status', $s)->where('end_at', '>=', now())
            );
        });

        // Localisation
        $profileQuery->when($request->location_type, function ($q, $l) {
            $q->whereHas('availabilityWindows', fn ($sq) =>
                $sq->where('location_type', $l)->where('end_at', '>=', now())
            );
        });

        // Période de disponibilité
        $profileQuery->when($request->available_from || $request->available_to, function ($q) use ($request) {
            $q->whereHas('availabilityWindows', function ($sq) use ($request) {
                $sq->where('status', '!=', 'unavailable');
                if ($request->available_from) $sq->where('end_at', '>=', $request->available_from);
                if ($request->available_to)   $sq->where('start_at', '<=', $request->available_to);
            });
        });

        // Vérifié uniquement
        $profileQuery->when($request->boolean('verified_only'), fn ($q) => $q->where('is_verified', true));

        // Langues (par noms)
        $profileQuery->when($wantedLanguageNames, function ($q) use ($wantedLanguageNames) {
            $q->whereHas('languages', fn ($sq) => $sq->whereIn('name', $wantedLanguageNames));
        });

        $profiles = $profileQuery
            ->orderByDesc('is_verified')
            ->latest()
            ->limit(50)
            ->get();

        // ============================================
        // 2) OFFRES DE MISE À DISPOSITION
        // ============================================
        $offerQuery = ResourceOffer::query()
            ->published()
            ->public()
            ->when(!empty($myCompanyIds), fn ($q) => $q->whereNotIn('company_id', $myCompanyIds))
            ->with([
                'company:id,name,logo_path,city,country,owner_user_id,is_verified',
                'profile.user:id,name',
                'profile.skills.category.parent',
                'profile.skills.category',
                'skills',
            ]);

        // Recherche texte
        $offerQuery->when($request->search, function ($q, $s) {
            $q->where(function ($sq) use ($s) {
                $sq->where('title', 'ilike', "%{$s}%")
                   ->orWhere('description', 'ilike', "%{$s}%")
                   ->orWhereHas('profile', fn ($pq) => $pq->where('headline', 'ilike', "%{$s}%"))
                   ->orWhereHas('profile.user', fn ($uq) => $uq->where('name', 'ilike', "%{$s}%"));
            });
        });

        $offerQuery->when($wantedSkillIds, fn ($q) =>
            $q->whereHas('skills', fn ($sq) => $sq->whereIn('skills.id', $wantedSkillIds))
        );

        $offerQuery->when($request->country, fn ($q, $v) => $q->where('country', $v));
        $offerQuery->when($request->city, fn ($q, $v) => $q->where('city', 'ilike', "%{$v}%"));
        $offerQuery->when($request->mission_type, fn ($q, $v) => $q->where('mission_type', $v));
        $offerQuery->when($request->location_type, fn ($q, $v) => $q->where('location_type', $v));
        $offerQuery->when($request->rate_min, fn ($q, $v) => $q->where('daily_rate', '>=', $v));
        $offerQuery->when($request->rate_max, fn ($q, $v) => $q->where('daily_rate', '<=', $v));

        $offerQuery->when($request->available_from || $request->available_to, function ($q) use ($request) {
            if ($request->available_from) $q->where('end_at', '>=', $request->available_from);
            if ($request->available_to)   $q->where('start_at', '<=', $request->available_to);
        });

        $offers = $offerQuery->latest()->limit(50)->get();

        // ============================================
        // 3) SCORING + MASQUAGE
        // ============================================
        $matcher = app(\App\Services\MatchingService::class);
        $userId = $user?->id;

        $profiles = $profiles->map(function ($p) use ($matcher, $criteria, $userId) {
            $isOwner = $userId && $userId === $p->user_id;
            $canSeeFull = $isOwner
                || $p->visibility === 'public'
                || ($p->visibility === 'network' && $userId);

            $p->result_type = 'profile';
            $p->match_score = $matcher->scoreSearch($p, $criteria, $userId, 'profile');
            $p->is_owner = $isOwner;
            $p->can_see_full = $canSeeFull;

            if (!$canSeeFull) {
                $p->makeHidden(['bio', 'experiences', 'educations', 'certifications', 'languages']);
            }

            if (!$canSeeFull && $p->user) {
                $p->user->makeHidden(['phone', 'email']);
            }

            return $p;
        });

        $offers = $offers->map(function ($o) use ($matcher, $criteria, $userId) {
            $o->result_type = 'offer';
            $o->match_score = $matcher->scoreSearch($o, $criteria, $userId, 'offer');
            return $o;
        });

        // ============================================
        // 4) FUSION + TRI
        // ============================================
        $all = $profiles->concat($offers)
            ->sortByDesc(fn ($item) => $item->match_score ?? -1)
            ->values();

        // ============================================
        // 5) PAGINATION
        // ============================================
        $perPage = (int) $request->get('per_page', 20);
        $page = (int) $request->get('page', 1);
        $total = $all->count();
        $items = $all->slice(($page - 1) * $perPage, $perPage)->values();

        return response()->json([
            'data' => $items,
            'total' => $total,
            'per_page' => $perPage,
            'current_page' => $page,
            'last_page' => max(1, ceil($total / $perPage)),
        ]);
    }

    /**
     * ✅ Voir un profil unique (FB-like)
     */
    public function show(Request $request, ProfessionalProfile $professionalProfile)
    {
        $viewer = auth('sanctum')->user();
        $isOwner = $viewer && $viewer->id === $professionalProfile->user_id;
        $isAdmin = $viewer && $viewer->isAdmin();

        $canSeeFull = $isOwner
            || $isAdmin
            || $professionalProfile->visibility === 'public'
            || ($professionalProfile->visibility === 'network' && $viewer);

        if (!$canSeeFull && $professionalProfile->visibility === 'private' && $viewer) {
            $hasRelation = $this->checkPrivateRelation($viewer, $professionalProfile);
            $canSeeFull = $hasRelation;
        }

        $professionalProfile->load([
            'user:id,name,first_name,last_name,country,phone,email',
            'skills.category.parent',
            'skills.category',
        ]);

        $professionalProfile->is_owner = $isOwner;
        $professionalProfile->can_see_full = $canSeeFull;
        $professionalProfile->can_view_contact = $isOwner
            || $professionalProfile->visibility === 'public';

        if ($canSeeFull) {
            $professionalProfile->load([
                'experiences',
                'educations',
                'certifications',
                'languages',
                'availabilityWindows' => fn ($q) => $q
                    ->where('end_at', '>=', now()->startOfDay())
                    ->orderBy('start_at'),
                'portfolio.projects',
            ]);
        }

        if (!$professionalProfile->can_view_contact && $professionalProfile->user) {
            $professionalProfile->user->makeHidden(['phone', 'email']);
        }

        return response()->json($professionalProfile);
    }

    /**
     * ✅ Vérifie si un viewer a une relation privée avec un profil
     */
    private function checkPrivateRelation($viewer, ProfessionalProfile $profile): bool
    {
        $companyIds = $viewer->companies()->pluck('id');
        $hasMission = \App\Models\Mission::where('professional_profile_id', $profile->id)
            ->where(function ($q) use ($companyIds) {
                $q->whereIn('supplying_company_id', $companyIds)
                  ->orWhereIn('requesting_company_id', $companyIds);
            })
            ->exists();

        if ($hasMission) return true;

        $hasConversation = \App\Models\Conversation::whereHas('participants', function ($q) use ($viewer) {
            $q->where('users.id', $viewer->id);
        })->whereHas('participants', function ($q) use ($profile) {
            $q->where('users.id', $profile->user_id);
        })->exists();

        return $hasConversation;
    }

    /**
     * ✅ Mon profil (propriétaire)
     */
    public function me(Request $request)
    {
        $profile = $request->user()->professionalProfile;

        if (!$profile) {
            return response()->json(null);
        }

        return $profile->load([
            'user',
            'skills.category.parent',
            'skills.category',
            'experiences',
            'educations',
            'certifications',
            'languages',
        ]);
    }

    /**
     * ✅ Créer mon profil
     */
    public function store(ProfessionalProfileRequest $request)
    {
        if ($request->user()->professionalProfile) {
            return response()->json(['message' => 'Profil déjà existant, utilisez update.'], 409);
        }

        $data = $request->validated();
        $data['user_id'] = $request->user()->id;

        $profile = ProfessionalProfile::create($data);

        return response()->json($profile, 201);
    }

    /**
     * ✅ Mettre à jour mon profil
     */
    public function update(ProfessionalProfileRequest $request, ProfessionalProfile $professionalProfile)
    {
        $this->authorize('update', $professionalProfile);
        $professionalProfile->update($request->validated());
        return $professionalProfile;
    }

    /**
     * ✅ Liste publique (legacy)
     */
    public function index(Request $request)
    {
        $query = ProfessionalProfile::query()
            ->whereIn('visibility', ['public', 'network', 'private'])
            ->with([
                'user:id,name',
                'skills.category.parent',
                'skills.category',
                'availabilityWindows' => function ($q) {
                    $q->where('end_at', '>=', now()->startOfDay())->orderBy('start_at');
                },
            ]);

        $query->when($request->skill_id, function ($q, $id) {
            $q->whereHas('skills', fn ($sq) => $sq->where('skills.id', $id));
        });

        $query->when($request->skill_category_id, function ($q, $catId) {
            $q->whereHas('skills.category', fn ($sq) =>
                $sq->where('id', $catId)->orWhere('parent_id', $catId)
            );
        });

        $query->when($request->profile_type, fn ($q, $v) => $q->where('profile_type', $v));
        $query->when($request->country, fn ($q, $v) => $q->where('country', $v));

        $query->when($request->availability_status, function ($q, $status) {
            $q->whereHas('availabilityWindows', function ($sq) use ($status) {
                $sq->where('status', $status)->where('end_at', '>=', now()->startOfDay());
            });
        });

        $query->when($request->availability_type, function ($q, $type) {
            $q->whereHas('availabilityWindows', function ($sq) use ($type) {
                $sq->where('type', $type)->where('end_at', '>=', now()->startOfDay());
            });
        });

        $query->when($request->location_type, function ($q, $loc) {
            $q->whereHas('availabilityWindows', function ($sq) use ($loc) {
                $sq->where('location_type', $loc)->where('end_at', '>=', now()->startOfDay());
            });
        });

        $query->when($request->available_from, function ($q, $date) {
            $q->whereHas('availabilityWindows', function ($sq) use ($date) {
                $sq->where('status', 'available')
                   ->where('start_at', '<=', $date)
                   ->where('end_at', '>=', $date);
            });
        });

        $query->when($request->boolean('remote'), function ($q) {
            $q->whereHas('availabilityWindows', fn ($sq) =>
                $sq->whereIn('location_type', ['remote', 'hybrid'])
            );
        });

        $query->when($request->boolean('available'), function ($q) {
            $q->whereHas('availabilityWindows', fn ($sq) =>
                $sq->where('status', 'available')
                   ->where('start_at', '<=', now())
                   ->where('end_at', '>=', now())
            );
        });

        $query->when($request->search, function ($q, $s) {
            $q->where(function ($sq) use ($s) {
                $sq->where('headline', 'ilike', "%{$s}%")
                   ->orWhere('bio', 'ilike', "%{$s}%")
                   ->orWhereHas('user', fn ($uq) => $uq->where('name', 'ilike', "%{$s}%"))
                   ->orWhereHas('skills', fn ($skq) => $skq->where('name', 'ilike', "%{$s}%"));
            });
        });

        return $query->latest()->paginate($request->get('per_page', 12));
    }

    /**
     * ✅ Upload avatar
     */
    public function uploadAvatar(Request $request)
    {
        try {
            $request->validate([
                'avatar' => ['required', 'file', 'image', 'mimes:jpeg,png,jpg,gif,webp,heic,heif', 'max:10240']
            ]);

            $user = $request->user();
            $profile = ProfessionalProfile::where('user_id', $user->id)->first();

            if (!$profile) {
                $profile = ProfessionalProfile::create([
                    'user_id' => $user->id,
                    'profile_type' => 'employee',
                    'headline' => 'Professionnel',
                    'visibility' => 'network',
                ]);
            }

            if ($profile->avatar_path) {
                Storage::disk('public')->delete($profile->avatar_path);
            }

            $path = $request->file('avatar')->store('avatars', 'public');
            $profile->update(['avatar_path' => $path]);

            return response()->json([
                'message' => 'Avatar mis à jour avec succès ✅',
                'avatar_url' => Storage::url($path),
                'profile' => $profile->fresh()
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur serveur: ' . $e->getMessage()], 500);
        }
    }

    /**
     * ✅ Upload CV
     */
    public function uploadCv(Request $request)
    {
        try {
            $request->validate(['cv' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:5120']]);

            $user = $request->user();
            $profile = ProfessionalProfile::where('user_id', $user->id)->first();

            if (!$profile) {
                return response()->json([
                    'message' => 'Créez d\'abord votre profil professionnel dans l\'onglet "Infos".'
                ], 422);
            }

            if ($profile->cv_path) {
                Storage::disk('public')->delete($profile->cv_path);
            }

            $path = $request->file('cv')->store('cvs', 'public');
            $profile->update(['cv_path' => $path]);

            return response()->json([
                'message' => 'CV mis à jour avec succès ✅',
                'cv_url' => Storage::url($path),
                'profile' => $profile->fresh()
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur serveur: ' . $e->getMessage()], 500);
        }
    }

    /**
     * ✅ Modifier la visibilité
     */
    public function updateVisibility(Request $request)
    {
        $data = $request->validate(['visibility' => ['required', 'in:public,private,network']]);

        $profile = $request->user()->professionalProfile;
        if (!$profile) return response()->json(['message' => 'Profil non trouvé.'], 404);

        $profile->update(['visibility' => $data['visibility']]);
        return response()->json($profile);
    }
}