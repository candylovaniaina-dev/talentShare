<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\JobOffer\JobOfferRequest;
use App\Models\JobOffer;
use App\Models\Notification;
use App\Models\OfferComment;
use App\Models\OfferLike;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class JobOfferController extends Controller
{
    /**
     * ✅ Liste publique des offres (avec likes + is_liked)
     */
    public function index(Request $request)
    {
        $user = auth('sanctum')->user();

        $query = JobOffer::query()
            ->where('status', 'published')
            ->with(['company:id,name,logo_path,city,country,owner_user_id', 'skills'])
            ->withCount('likes')
            ->when($user, function ($q) use ($user) {
                $q->with(['likes' => fn ($lq) => $lq->where('user_id', $user->id)]);
            })
            ->when($request->offer_type, fn ($q, $v) => $q->where('offer_type', $v))
            ->when($request->skill_id, function ($q, $skillId) {
                $q->whereHas('skills', fn ($sq) => $sq->where('skills.id', $skillId));
            })
            ->when($request->country, fn ($q, $v) => $q->where('country', $v))
            ->when($request->boolean('remote'), fn ($q) => $q->where('remote', true))
            ->when($request->search, function ($q, $s) {
                $q->where(function ($sq) use ($s) {
                    $sq->where('title', 'ilike', "%{$s}%")
                       ->orWhere('description', 'ilike', "%{$s}%")
                       ->orWhereHas('company', fn ($cq) => $cq->where('name', 'ilike', "%{$s}%"));
                });
            });

        // ✅ Filtre spécial : exclure mes propres offres (pour Actualité)
        if ($request->boolean('exclude_mine') && $user) {
            $myCompanyIds = $user->companies()->pluck('id')->toArray();
            if (!empty($myCompanyIds)) {
                $query->whereNotIn('company_id', $myCompanyIds);
            }
        }

        // ✅ Filtre spécial : uniquement mes offres (pour Accueil)
        if ($request->boolean('only_mine') && $user) {
            $myCompanyIds = $user->companies()->pluck('id')->toArray();
            if (!empty($myCompanyIds)) {
                $query->whereIn('company_id', $myCompanyIds);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        $offers = $query->latest()->paginate($request->get('per_page', 15));

        // ✅ Enrichir chaque offre avec is_liked
               // ✅ Enrichir chaque offre avec is_liked
        $offers->getCollection()->transform(function ($offer) use ($user) {
            $offer->is_liked = $user
                ? $offer->likes->where('user_id', $user->id)->isNotEmpty()
                : false;
            $offer->likes_count = $offer->likes_count ?? 0;
            $offer->comments_count = \App\Models\OfferComment::where('job_offer_id', $offer->id)->count();
            unset($offer->likes);
            return $offer;
        });

        return $offers;
    }

    public function show(JobOffer $jobOffer)
    {
        return $jobOffer->load(['company', 'skills'])
            ->loadCount('likes')
            ->loadCount('comments');
    }

    public function store(JobOfferRequest $request)
    {
        if ($request->user()->companies()->where('id', $request->company_id)->doesntExist()) {
            return response()->json(['message' => 'Cette entreprise ne vous appartient pas.'], 403);
        }

        $data = $request->validated();
        $skills = $data['skills'] ?? [];
        unset($data['skills']);
        $data['created_by'] = $request->user()->id;

        $jobOffer = JobOffer::create($data);

        if ($skills) {
            $jobOffer->skills()->sync(
                collect($skills)->mapWithKeys(fn ($s) => [$s['skill_id'] => ['min_level' => $s['min_level']]])
            );
        }

        return response()->json($jobOffer->load('skills'), 201);
    }

    public function update(JobOfferRequest $request, JobOffer $jobOffer)
    {
        $this->authorize('update', $jobOffer);

        $data = $request->validated();
        $skills = $data['skills'] ?? null;
        unset($data['skills']);

        $jobOffer->update($data);

        if ($skills !== null) {
            $jobOffer->skills()->sync(
                collect($skills)->mapWithKeys(fn ($s) => [$s['skill_id'] => ['min_level' => $s['min_level']]])
            );
        }

        return $jobOffer->load('skills');
    }

    public function destroy(JobOffer $jobOffer)
    {
        $this->authorize('delete', $jobOffer);
        $jobOffer->delete();

        return response()->json(['message' => 'Offre supprimée.']);
    }

    public function applications(Request $request, JobOffer $jobOffer)
    {
        $isOwner = $request->user()->companies()
            ->where('id', $jobOffer->company_id)->exists();

        abort_unless($isOwner, 403, 'Non autorisé.');

        $applications = $jobOffer->applications()
            ->with([
                'profile.user:id,name,email,phone,first_name,last_name',
                'profile.skills.category.parent',
                'profile.skills.category',
                'profile.educations',
                'profile.experiences',
                'portfolio:id,title,public_slug',
            ])
            ->orderByRaw("CASE status 
                WHEN 'interview' THEN 1
                WHEN 'shortlisted' THEN 2
                WHEN 'viewed' THEN 3
                WHEN 'sent' THEN 4
                WHEN 'accepted' THEN 5
                WHEN 'rejected' THEN 6
                ELSE 7 END")
            ->latest()
            ->get();

        $jobOffer->applications()
            ->where('status', 'sent')
            ->update(['status' => 'viewed', 'viewed_at' => now()]);

        return response()->json([
            'job_offer' => $jobOffer->load('company:id,name,logo_path'),
            'applications' => $applications,
            'stats' => [
                'total' => $applications->count(),
                'sent' => $applications->where('status', 'sent')->count(),
                'viewed' => $applications->where('status', 'viewed')->count(),
                'shortlisted' => $applications->where('status', 'shortlisted')->count(),
                'interview' => $applications->where('status', 'interview')->count(),
                'accepted' => $applications->where('status', 'accepted')->count(),
                'rejected' => $applications->where('status', 'rejected')->count(),
            ],
        ]);
    }

    public function my(Request $request)
    {
        $user = $request->user();
        $companyIds = $user->companies()->pluck('id');

        if ($companyIds->isEmpty()) {
            return response()->json([]);
        }

        return JobOffer::query()
            ->whereIn('company_id', $companyIds)
            ->with(['company:id,name,logo_path,city,country', 'skills'])
            ->withCount('applications')
            ->withCount('likes')
            ->withCount('comments')
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->when($request->offer_type, fn($q, $v) => $q->where('offer_type', $v))
            ->latest()
            ->get();
    }

    // ============================================
    // ✅ INTERACTIONS SOCIALES
    // ============================================

    /**
     * ✅ Toggle like + notif au propriétaire
     */
      /**
     * ✅ Toggle like + notif au propriétaire
     */
    public function toggleLike(Request $request, JobOffer $jobOffer)
    {
        $user = $request->user();

        $existing = OfferLike::where('job_offer_id', $jobOffer->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existing) {
            $existing->delete();
            $liked = false;
        } else {
            OfferLike::create([
                'job_offer_id' => $jobOffer->id,
                'user_id' => $user->id,
            ]);
            $liked = true;

            // ✅ Notifier le propriétaire
            $ownerId = $jobOffer->company?->owner_user_id;
            if ($ownerId && $ownerId !== $user->id) {
                try {
                    Notification::create([
                        'user_id' => $ownerId,
                        'type' => 'offer_liked',
                        'title' => '❤️ Nouveau J\'aime',
                        'body' => "{$user->name} a aimé votre offre « {$jobOffer->title} »",
                        'subject_type' => JobOffer::class,
                        'subject_id' => $jobOffer->id,
                        'data' => [
                            'url' => "/company#offer-{$jobOffer->id}",
                            'offer_id' => $jobOffer->id,
                        ],
                    ]);
                } catch (\Exception $e) {
                    \Log::warning('Erreur notif like: ' . $e->getMessage());
                }
            }
        }

        $likesCount = OfferLike::where('job_offer_id', $jobOffer->id)->count();

        return response()->json([
            'liked' => $liked,
            'likes_count' => $likesCount,
        ]);
    }

    /**
     * ✅ Ajouter un commentaire + notif au propriétaire
     */
    public function comment(Request $request, JobOffer $jobOffer)
    {
        $data = $request->validate([
            'content' => 'required|string|max:2000',
        ]);

        $user = $request->user();

        $comment = OfferComment::create([
            'job_offer_id' => $jobOffer->id,
            'user_id' => $user->id,
            'content' => $data['content'],
        ]);

        // ✅ Notifier le propriétaire
        $ownerId = $jobOffer->company?->owner_user_id;
        if ($ownerId && $ownerId !== $user->id) {
            try {
                Notification::create([
                    'user_id' => $ownerId,
                    'type' => 'offer_commented',
                    'title' => '💬 Nouveau commentaire',
                    'body' => "{$user->name} a commenté votre offre « {$jobOffer->title} » : " 
                              . Str::limit($data['content'], 60),
                    'subject_type' => JobOffer::class,
                    'subject_id' => $jobOffer->id,
                    'data' => [
                        'url' => "/company#offer-{$jobOffer->id}",
                        'offer_id' => $jobOffer->id,
                        'comment_id' => $comment->id,
                    ],
                ]);
            } catch (\Exception $e) {
                \Log::warning('Erreur notif comment: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Commentaire ajouté ✅',
            'comment' => $comment->load('user:id,name'),
        ], 201);
    }

    /**
     * ✅ Récupérer les commentaires d'une offre
     */
    public function comments(Request $request, JobOffer $jobOffer)
    {
        $comments = OfferComment::where('job_offer_id', $jobOffer->id)
            ->with('user:id,name')
            ->latest()
            ->limit(50)
            ->get();

        return response()->json(['data' => $comments]);
    }
}