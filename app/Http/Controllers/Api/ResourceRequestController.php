<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ResourceRequest\ResourceRequestRequest;
use App\Models\ResourceRequest;
use App\Services\MatchingService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use App\Models\ResourceRequestComment;
use App\Models\ResourceRequestLike;
use App\Models\Notification;
use Illuminate\Support\Str;

class ResourceRequestController extends Controller
{
    // ============================================
    // INDEX — Public OU Mes demandes
    // ============================================
    public function index(Request $request)
    {
        $user = auth('sanctum')->user();

        // ✅ Mes demandes (entreprises + talents)
        if ($request->boolean('my')) {
            abort_unless($user, 401);

            $companyIds = $user->companies()->pluck('id')->toArray();

            // ✅ FIX : retiré published() — myPublications fait déjà le filtre
            return ResourceRequest::myPublications($user->id, $companyIds)
                ->with([
                    'company:id,name,logo_path',
                    'author:id,name,role',
                    'author.professionalProfile:id,user_id,avatar_path,headline',  // ✅ FIX
                    'skills',
                ])
                ->withCount(['proposals', 'likes', 'comments'])
                ->latest()
                ->get()
                ->map(fn ($r) => $this->appendDisplayData($r));
        }

        // ✅ Liste publique
        return ResourceRequest::published()
            ->with([
                'company:id,name,logo_path,city,country,is_verified',
                'author:id,name,role',
                'author.professionalProfile:id,user_id,avatar_path,headline',  // ✅ FIX
                'skills.category.parent',
                'skills.category',
            ])
            ->withCount(['proposals', 'likes', 'comments'])
            ->when($user, function ($q) use ($user) {
                $q->with(['likes' => fn ($lq) => $lq->where('user_id', $user->id)]);
            })
            ->when($request->search, fn ($q, $s) => $q->search($s))
            ->when($request->skill_id, fn ($q, $id) =>
                $q->whereHas('skills', fn ($sq) => $sq->where('skills.id', $id))
            )
            ->when($request->country, fn ($q, $v) => $q->where('country', $v))
            ->when($request->city, fn ($q, $v) => $q->where('city', 'ilike', "%{$v}%"))
            ->when($request->boolean('remote'), fn ($q) => $q->where('remote', true))
            ->when($request->urgency, fn ($q, $v) => $q->where('urgency', $v))
            ->when($request->budget_min, fn ($q, $v) => $q->where('budget_max', '>=', $v))
            ->when($request->budget_max, fn ($q, $v) => $q->where('budget_min', '<=', $v))
            ->latest()
            ->paginate($request->get('per_page', 15))
            ->through(function ($r) use ($user) {
                $r->is_liked = $user ? $r->likes->where('user_id', $user->id)->isNotEmpty() : false;
                unset($r->likes);
                return $this->appendDisplayData($r);
            });
    }

    // ============================================
    // SHOW
    // ============================================
    public function show(Request $request, ResourceRequest $resourceRequest)
    {
        $this->authorize('view', $resourceRequest);

        $user = auth('sanctum')->user();
        $isOwner = $user && (
            $user->id === $resourceRequest->created_by
            || $user->companies()->where('id', $resourceRequest->company_id)->exists()
        );

        if (!$isOwner) {
            $resourceRequest->increment('views_count');
        }

        $resourceRequest->load([
            'company:id,name,logo_path,city,country,is_verified,description',
            'author:id,name,role',
            'author.professionalProfile:id,user_id,avatar_path,headline',  // ✅ FIX
            'skills.category.parent',
            'skills.category',
            'creator:id,name',
        ]);

        $resourceRequest->is_owner = $isOwner;
        $resourceRequest->proposals_count = $resourceRequest->proposals()->count();

        return $this->appendDisplayData($resourceRequest);
    }

    // ============================================
    // STORE — Entreprise OU Talent
    // ============================================
    public function store(ResourceRequestRequest $request, NotificationService $notifications)
    {
        $user = $request->user();
        $data = $request->validated();
        $skills = $data['skills'] ?? [];
        unset($data['skills']);

        // ✅ Cas 1 : Entreprise (company_id fourni)
        if (!empty($data['company_id'])) {
            if ($user->companies()->where('id', $data['company_id'])->doesntExist()) {
                return response()->json(['message' => 'Cette entreprise ne vous appartient pas.'], 403);
            }
            $data['author_type'] = 'company';
        }
        // ✅ Cas 2 : Talent (pas de company_id)
        else {
            if (!$user->isTalent()) {
                return response()->json([
                    'message' => 'Seules les entreprises ou les talents peuvent publier.',
                ], 403);
            }
            $data['company_id'] = null;
            $data['author_type'] = 'talent';
        }

        $data['created_by'] = $user->id;

        // ✅ Auto-expiration 60 jours
        if (empty($data['expires_at']) && ($data['status'] ?? 'draft') === 'published') {
            $data['expires_at'] = now()->addDays(60)->toDateString();
        }

        // ✅ Tags
        if (isset($data['tags']) && !is_array($data['tags'])) {
            $data['tags'] = $data['tags'] ? [$data['tags']] : null;
        }

        // ✅ Positions par défaut
        if (empty($data['positions_count'])) {
            $data['positions_count'] = 1;
        }

        // ✅ Urgency par défaut
        if (empty($data['urgency'])) {
            $data['urgency'] = 'normal';
        }

        $resourceRequest = ResourceRequest::create($data);
        $this->syncSkills($resourceRequest, $skills);

        // ✅ Notifier les talents matching si publiée
        if ($resourceRequest->status === 'published') {
            try {
                $this->notifyMatchingTalents($resourceRequest, $notifications);
            } catch (\Exception $e) {
                \Log::warning('notifyMatchingTalents failed: ' . $e->getMessage());
            }
        }

        return response()->json(
            $this->appendDisplayData($resourceRequest->load([
                'skills',
                'company',
                'author',
                'author.professionalProfile:id,user_id,avatar_path,headline',  // ✅ FIX
            ])),
            201
        );
    }

    // ============================================
    // UPDATE
    // ============================================
    public function update(ResourceRequestRequest $request, ResourceRequest $resourceRequest)
    {
        $this->authorize('update', $resourceRequest);

        $data = $request->validated();
        $skills = $data['skills'] ?? null;
        unset($data['skills']);

        if (isset($data['tags']) && !is_array($data['tags'])) {
            $data['tags'] = $data['tags'] ? [$data['tags']] : null;
        }

        $wasDraft = $resourceRequest->status === 'draft';
        $resourceRequest->update($data);

        if ($skills !== null) {
            $this->syncSkills($resourceRequest, $skills);
        }

        if ($wasDraft && $resourceRequest->status === 'published') {
            try {
                $this->notifyMatchingTalents($resourceRequest, app(NotificationService::class));
            } catch (\Exception $e) {
                \Log::warning('notifyMatchingTalents failed: ' . $e->getMessage());
            }
        }

        return $this->appendDisplayData($resourceRequest->load([
            'skills',
            'company',
            'author',
            'author.professionalProfile:id,user_id,avatar_path,headline',  // ✅ FIX
        ]));
    }

    // ============================================
    // DESTROY
    // ============================================
    public function destroy(ResourceRequest $resourceRequest)
    {
        $this->authorize('delete', $resourceRequest);
        $resourceRequest->delete();

        return response()->json(['message' => 'Demande supprimée.']);
    }

    // ============================================
    // ACTIONS DE STATUT
    // ============================================
    public function publish(ResourceRequest $resourceRequest, NotificationService $notifications)
    {
        $this->authorize('changeStatus', $resourceRequest);

        if (!in_array($resourceRequest->status, ['draft', 'paused'])) {
            return response()->json([
                'message' => 'Seules les demandes en brouillon ou en pause peuvent être publiées.',
                'current_status' => $resourceRequest->status,
            ], 409);
        }

        $resourceRequest->update([
            'status' => 'published',
            'expires_at' => $resourceRequest->expires_at ?? now()->addDays(60),
            'closed_reason' => null,
            'closed_at' => null,
        ]);

        try {
            $this->notifyMatchingTalents($resourceRequest, $notifications);
        } catch (\Exception $e) {
            \Log::warning('notifyMatchingTalents failed: ' . $e->getMessage());
        }

        return $this->appendDisplayData($resourceRequest->load([
            'skills',
            'company',
            'author',
            'author.professionalProfile:id,user_id,avatar_path,headline',  // ✅ FIX
        ]));
    }

    public function pause(ResourceRequest $resourceRequest)
    {
        $this->authorize('changeStatus', $resourceRequest);

        if (!in_array($resourceRequest->status, ['published', 'expired'])) {
            return response()->json([
                'message' => 'Seule une demande publiée peut être mise en pause.',
                'current_status' => $resourceRequest->status,
            ], 409);
        }

        $resourceRequest->update([
            'status' => 'paused',
            'expires_at' => $resourceRequest->expires_at ?? now()->addDays(30),
        ]);

        return $this->appendDisplayData($resourceRequest);
    }

    public function close(ResourceRequest $resourceRequest)
    {
        $this->authorize('changeStatus', $resourceRequest);

        if (!in_array($resourceRequest->status, ['published', 'paused', 'expired'])) {
            return response()->json([
                'message' => 'Cette demande ne peut pas être fermée.',
                'current_status' => $resourceRequest->status,
            ], 409);
        }

        $resourceRequest->update([
            'status' => 'closed',
            'closed_reason' => 'manual',
            'closed_at' => now(),
        ]);

        return $this->appendDisplayData($resourceRequest);
    }

    public function markFilled(ResourceRequest $resourceRequest)
    {
        $this->authorize('changeStatus', $resourceRequest);

        if (!in_array($resourceRequest->status, ['published', 'paused', 'expired'])) {
            return response()->json([
                'message' => 'Cette demande ne peut pas être marquée comme pourvue.',
                'current_status' => $resourceRequest->status,
            ], 409);
        }

        $resourceRequest->update([
            'status' => 'filled',
            'closed_reason' => 'filled',
            'closed_at' => now(),
        ]);

        return $this->appendDisplayData($resourceRequest);
    }

    public function duplicate(ResourceRequest $resourceRequest)
    {
        $this->authorize('view', $resourceRequest);

        $clone = $resourceRequest->replicate();
        $clone->title = $resourceRequest->title . ' (copie)';
        $clone->status = 'draft';
        $clone->expires_at = now()->addDays(60);
        $clone->closed_reason = null;
        $clone->closed_at = null;
        $clone->views_count = 0;
        $clone->proposals_count = 0;
        $clone->save();

        $pivot = $resourceRequest->skills
            ->pluck('pivot.min_level', 'id')
            ->mapWithKeys(fn ($lvl, $id) => [$id => ['min_level' => $lvl]])
            ->toArray();

        if (!empty($pivot)) {
            $clone->skills()->sync($pivot);
        }

        return response()->json($clone->load('skills'), 201);
    }

    // ============================================
    // CANDIDATS MATCHÉS
    // ============================================
    public function candidates(ResourceRequest $resourceRequest, MatchingService $matching)
    {
        $this->authorize('viewCandidates', $resourceRequest);

        $ranked = $matching->rankCandidates($resourceRequest, 30);

        $ranked = $ranked->filter(function ($item) {
            $user = $item['profile']->user ?? null;
            if (!$user) return false;
            return in_array($user->role, ['employee', 'student']);
        });

        return response()->json(
            $ranked->values()->map(fn ($item) => [
                'profile_id'   => $item['profile']->id,
                'name'         => $item['profile']->user->name,
                'headline'     => $item['profile']->headline,
                'avatar_path'  => $item['profile']->avatar_path,
                'city'         => $item['profile']->city,
                'role'         => $item['profile']->user->role,
                'match'        => $item['match'],
            ])
        );
    }

    // ============================================
    // ✅ INTERACTIONS SOCIALES
    // ============================================

    public function toggleLike(Request $request, ResourceRequest $resourceRequest)
    {
        $user = $request->user();

        $existing = ResourceRequestLike::where('resource_request_id', $resourceRequest->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existing) {
            $existing->delete();
            $liked = false;
        } else {
            ResourceRequestLike::create([
                'resource_request_id' => $resourceRequest->id,
                'user_id' => $user->id,
            ]);
            $liked = true;

            $ownerId = $resourceRequest->created_by;
            if ($ownerId && $ownerId !== $user->id) {
                try {
                    Notification::create([
                        'user_id' => $ownerId,
                        'type' => 'request_liked',
                        'title' => '❤️ Nouveau J\'aime',
                        'body' => "{$user->name} a aimé votre demande « {$resourceRequest->title} »",
                        'subject_type' => ResourceRequest::class,
                        'subject_id' => $resourceRequest->id,
                        'data' => json_encode([
                            'url' => "/resource-requests/{$resourceRequest->id}",
                            'request_id' => $resourceRequest->id,
                        ]),
                    ]);
                } catch (\Exception $e) {
                    \Log::warning('Erreur notif like: ' . $e->getMessage());
                }
            }
        }

        $likesCount = ResourceRequestLike::where('resource_request_id', $resourceRequest->id)->count();

        return response()->json([
            'liked' => $liked,
            'likes_count' => $likesCount,
        ]);
    }

    public function comment(Request $request, ResourceRequest $resourceRequest)
    {
        $data = $request->validate([
            'content' => 'required|string|max:2000',
        ]);

        $user = $request->user();

        $comment = ResourceRequestComment::create([
            'resource_request_id' => $resourceRequest->id,
            'user_id' => $user->id,
            'content' => $data['content'],
        ]);

        $ownerId = $resourceRequest->created_by;
        if ($ownerId && $ownerId !== $user->id) {
            try {
                Notification::create([
                    'user_id' => $ownerId,
                    'type' => 'request_commented',
                    'title' => '💬 Nouveau commentaire',
                    'body' => "{$user->name} a commenté votre demande « {$resourceRequest->title} » : "
                              . Str::limit($data['content'], 60),
                    'subject_type' => ResourceRequest::class,
                    'subject_id' => $resourceRequest->id,
                    'data' => json_encode([
                        'url' => "/resource-requests/{$resourceRequest->id}",
                        'request_id' => $resourceRequest->id,
                        'comment_id' => $comment->id,
                    ]),
                ]);
            } catch (\Exception $e) {
                \Log::warning('Erreur notif comment: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Commentaire ajouté ✅',
            'comment' => $comment->load('user:id,name,avatar_path'),
        ], 201);
    }

    public function comments(Request $request, ResourceRequest $resourceRequest)
    {
        $comments = ResourceRequestComment::where('resource_request_id', $resourceRequest->id)
            ->with('user:id,name,avatar_path')
            ->latest()
            ->limit(50)
            ->get();

        return response()->json(['data' => $comments]);
    }

    public function share(Request $request, ResourceRequest $resourceRequest)
    {
        $resourceRequest->increment('shares_count');

        return response()->json([
            'success' => true,
            'shares_count' => $resourceRequest->fresh()->shares_count,
        ]);
    }

    // ============================================
    // HELPERS
    // ============================================
    private function appendDisplayData(ResourceRequest $r): ResourceRequest
    {
        try {
            $r->append(['display_status', 'status_label', 'days_until_expiry', 'is_open', 'is_talent_request']);
        } catch (\Exception $e) {
            \Log::warning('appendDisplayData failed: ' . $e->getMessage());
            $r->display_status = $r->status;
            $r->status_label = $r->status;
            $r->days_until_expiry = null;
            $r->is_open = false;
            $r->is_talent_request = false;
        }
        return $r;
    }

    private function notifyMatchingTalents(ResourceRequest $request, NotificationService $notifications): void
    {
        try {
            $matcher = app(MatchingService::class);
            $matches = $matcher->rankCandidates($request, 10)
                ->filter(fn ($m) => $m['match']['total'] >= 60);

            foreach ($matches as $item) {
                $user = $item['profile']->user;
                if (!$user) continue;

                $authorName = $request->author_type === 'talent'
                    ? ($request->author?->name ?? 'Un talent')
                    : ($request->company?->name ?? 'Une entreprise');

                $notifications->notify(
                    $user,
                    'resource_request_published',
                    '🎯 Nouvelle demande correspondant à votre profil',
                    "{$authorName} recherche : {$request->title}",
                    $request,
                    [
                        'resource_request_id' => $request->id,
                        'match_score' => $item['match']['total'],
                    ]
                );
            }
        } catch (\Exception $e) {
            \Log::warning('notifyMatchingTalents failed: ' . $e->getMessage());
        }
    }

    private function syncSkills(ResourceRequest $resourceRequest, array $skills): void
    {
        if (empty($skills)) {
            $resourceRequest->skills()->detach();
            return;
        }

        $syncData = [];

        foreach ($skills as $item) {
            $minLevel = $item['min_level'] ?? 'intermediate';
            $skillId = $item['skill_id'] ?? null;
            $name = isset($item['name']) ? trim($item['name']) : null;

            if ($skillId) {
                $exists = \App\Models\Skill::where('id', $skillId)->exists();
                if ($exists) {
                    $syncData[$skillId] = ['min_level' => $minLevel];
                    continue;
                }
            }

            if ($name) {
                $skill = \App\Models\Skill::whereRaw('LOWER(name) = ?', [strtolower($name)])->first();
                if (!$skill) {
                    $skill = \App\Models\Skill::create([
                        'name' => $name,
                        'category_id' => null,
                    ]);
                }
                $syncData[$skill->id] = ['min_level' => $minLevel];
            }
        }

        $resourceRequest->skills()->sync($syncData);
    }
}