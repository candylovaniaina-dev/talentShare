<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ResourceRequest\ResourceRequestRequest;
use App\Models\ResourceRequest;
use App\Services\MatchingService;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class ResourceRequestController extends Controller
{
    // ============================================
    // INDEX — Public (talents) OU Mes demandes (entreprises)
    // ============================================
    public function index(Request $request)
    {
        $user = auth('sanctum')->user();

        // ✅ Mes demandes
        if ($request->boolean('my')) {
            abort_unless($user, 401);

            // ⚠️ FIX : toArray() obligatoire pour scopeMyCompany
            $companyIds = $user->companies()->pluck('id')->toArray();

            return ResourceRequest::myCompany($companyIds)
                ->with([
                    'company:id,name,logo_path',
                    'skills',
                ])
                ->withCount('proposals')
                ->latest()
                ->get()
                ->map(fn ($r) => $this->appendDisplayData($r));
        }

        // ✅ Liste publique
        return ResourceRequest::published()
            ->with([
                'company:id,name,logo_path,city,country,is_verified',
                'skills.category.parent',
                'skills.category',
            ])
            ->withCount('proposals')
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
            ->through(fn ($r) => $this->appendDisplayData($r));
    }

    // ============================================
    // SHOW — Détail public
    // ============================================
    public function show(Request $request, ResourceRequest $resourceRequest)
    {
        $this->authorize('view', $resourceRequest);

        $user = auth('sanctum')->user();
        $isOwner = $user && $user->companies()->where('id', $resourceRequest->company_id)->exists();

        // ✅ Incrémenter les vues si ce n'est pas le propriétaire
        if (!$isOwner) {
            $resourceRequest->increment('views_count');
        }

        $resourceRequest->load([
            'company:id,name,logo_path,city,country,is_verified,description',
            'skills.category.parent',
            'skills.category',
            'creator:id,name',
        ]);

        $resourceRequest->is_owner = $isOwner;
        $resourceRequest->proposals_count = $resourceRequest->proposals()->count();

        return $this->appendDisplayData($resourceRequest);
    }

    // ============================================
    // STORE — Création
    // ============================================
    public function store(ResourceRequestRequest $request, NotificationService $notifications)
    {
        if ($request->user()->companies()->where('id', $request->company_id)->doesntExist()) {
            return response()->json(['message' => 'Cette entreprise ne vous appartient pas.'], 403);
        }

        $data = $request->validated();
        $skills = $data['skills'] ?? [];
        unset($data['skills']);

        $data['created_by'] = $request->user()->id;

        // ✅ Auto-expiration 60 jours par défaut
        if (empty($data['expires_at']) && ($data['status'] ?? 'draft') === 'published') {
            $data['expires_at'] = now()->addDays(60)->toDateString();
        }

        // ✅ Tags : s'assurer que c'est un array
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

        if ($skills) {
            $resourceRequest->skills()->sync(
                collect($skills)->mapWithKeys(fn ($s) => [
                    $s['skill_id'] => ['min_level' => $s['min_level'] ?? 'intermediate'],
                ])
            );
        }

        // ✅ Notifier les talents matching si publiée
        if ($resourceRequest->status === 'published') {
            try {
                $this->notifyMatchingTalents($resourceRequest, $notifications);
            } catch (\Exception $e) {
                \Log::warning('notifyMatchingTalents failed: ' . $e->getMessage());
            }
        }

        return response()->json(
            $this->appendDisplayData($resourceRequest->load('skills')),
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

        // ✅ Tags : s'assurer que c'est un array
        if (isset($data['tags']) && !is_array($data['tags'])) {
            $data['tags'] = $data['tags'] ? [$data['tags']] : null;
        }

        $wasDraft = $resourceRequest->status === 'draft';
        $resourceRequest->update($data);

        if ($skills !== null) {
            $resourceRequest->skills()->sync(
                collect($skills)->mapWithKeys(fn ($s) => [
                    $s['skill_id'] => ['min_level' => $s['min_level'] ?? 'intermediate'],
                ])
            );
        }

        // ✅ Draft → Published → notifier
        if ($wasDraft && $resourceRequest->status === 'published') {
            try {
                $this->notifyMatchingTalents($resourceRequest, app(NotificationService::class));
            } catch (\Exception $e) {
                \Log::warning('notifyMatchingTalents failed: ' . $e->getMessage());
            }
        }

        return $this->appendDisplayData($resourceRequest->load('skills'));
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

    /**
     * ✅ Publier (draft/paused → published)
     */
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

        return $this->appendDisplayData($resourceRequest->load('skills'));
    }

    /**
     * ✅ Pause (published/expired → paused)
     * ⚠️ FIX : accepte aussi 'expired' pour éviter le 409
     */
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

    /**
     * ✅ Fermer (published/paused/expired → closed)
     * ⚠️ FIX : accepte aussi 'expired'
     */
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

    /**
     * ✅ Marquer pourvue (published/paused/expired → filled)
     * ⚠️ FIX : accepte aussi 'expired'
     */
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

    /**
     * ✅ Dupliquer
     */
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

        // Copier les compétences
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

        return response()->json(
            $ranked->map(fn ($item) => [
                'profile_id'   => $item['profile']->id,
                'name'         => $item['profile']->user->name,
                'headline'     => $item['profile']->headline,
                'avatar_path'  => $item['profile']->avatar_path,
                'city'         => $item['profile']->city,
                'match'        => $item['match'],
            ])
        );
    }

    // ============================================
    // HELPERS
    // ============================================
    private function appendDisplayData(ResourceRequest $r): ResourceRequest
    {
        try {
            $r->append(['display_status', 'status_label', 'days_until_expiry', 'is_open']);
        } catch (\Exception $e) {
            \Log::warning('appendDisplayData failed: ' . $e->getMessage());
            // Fallback minimal
            $r->display_status = $r->status;
            $r->status_label = $r->status;
            $r->days_until_expiry = null;
            $r->is_open = false;
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

                $notifications->notify(
                    $user,
                    'resource_request_published',
                    '🎯 Nouvelle demande correspondant à votre profil',
                    "{$request->company->name} recherche : {$request->title}",
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
}