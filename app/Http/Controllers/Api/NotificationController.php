<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Liste des notifications de l'utilisateur connecté
     */
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->latest()
            ->limit(50)
            ->get()
            ->map(function ($n) {
                return [
                    'id' => $n->id,
                    'type' => $n->type,
                    'title' => $n->title,
                    'body' => $n->body,
                    'subject_type' => $n->subject_type,
                    'subject_id' => $n->subject_id,
                    'read_at' => $n->read_at,
                    'created_at' => $n->created_at,
                    'action_url' => $n->action_url,
                    'actor' => $this->resolveActor($n),   // ✅ AJOUT
                ];
            });

        $unreadCount = Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * ✅ Résout l'acteur (celui qui a déclenché la notif) avec sa photo
     */
    protected function resolveActor(Notification $n): ?array
    {
        try {
            $subject = $n->subject;

            // Cas 1 : candidature → on renvoie le user du profil OU la company
            if (str_contains($n->subject_type ?? '', 'Application') && $subject) {
                $subject->loadMissing('jobOffer.company', 'profile.user');
                $company = $subject->jobOffer?->company;
                $candidate = $subject->profile?->user;

                // Pour "new_application" → l'acteur c'est le candidat
                if ($n->type === 'new_application' && $candidate) {
                    return [
                        'id' => $candidate->id,
                        'name' => $candidate->name,
                        'avatar_path' => $candidate->professionalProfile?->avatar_path
                            ?? $candidate->avatar_path,
                        'role' => 'candidate',
                        'type' => 'user',
                    ];
                }

                // Pour "application_shortlisted/interview/..." → l'acteur c'est la company
                if ($company) {
                    return [
                        'id' => $company->id,
                        'name' => $company->name,
                        'avatar_path' => $company->logo_path,
                        'role' => 'company',
                        'type' => 'company',
                    ];
                }
            }

            // Cas 2 : offre d'emploi (like, commentaire) → company
            if (str_contains($n->subject_type ?? '', 'JobOffer') && $subject) {
                $subject->loadMissing('company');
                $company = $subject->company;
                if ($company) {
                    return [
                        'id' => $company->id,
                        'name' => $company->name,
                        'avatar_path' => $company->logo_path,
                        'role' => 'company',
                        'type' => 'company',
                    ];
                }
            }

            // Cas 3 : message → on prend l'expéditeur depuis data
            if ($n->type === 'new_message' && is_array($n->data) && isset($n->data['sender_id'])) {
                $sender = \App\Models\User::find($n->data['sender_id']);
                if ($sender) {
                    return [
                        'id' => $sender->id,
                        'name' => $sender->name,
                        'avatar_path' => $sender->professionalProfile?->avatar_path
                            ?? $sender->avatar_path,
                        'role' => 'user',
                        'type' => 'user',
                    ];
                }
            }

            // Cas 4 : interactions sociales (like / commentaire sur offre)
            if (in_array($n->type, ['offer_liked', 'offer_commented'])
                && is_array($n->data) && isset($n->data['actor_id'])) {
                $actor = \App\Models\User::find($n->data['actor_id']);
                if ($actor) {
                    return [
                        'id' => $actor->id,
                        'name' => $actor->name,
                        'avatar_path' => $actor->professionalProfile?->avatar_path
                            ?? $actor->avatar_path,
                        'role' => 'user',
                        'type' => 'user',
                    ];
                }
            }
        } catch (\Exception $e) {
            \Log::warning("resolveActor error: " . $e->getMessage());
        }

        return null;
    }

    public function markRead(Request $request, $id)
    {
        $notification = Notification::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();

        $notification->update(['read_at' => now()]);

        return response()->json([
            'message' => 'Notification marquée comme lue',
            'notification' => $notification,
        ]);
    }

    public function markAllRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'Tout marqué comme lu.']);
    }
        /**
     * ✅ Historique complet de l'activité (regroupé par date)
     */
    public function history(Request $request)
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->latest()
            ->limit(200)
            ->get()
            ->groupBy(fn ($n) => $n->created_at->format('Y-m-d'))
            ->map(function ($items, $date) {
                return [
                    'date' => $date,
                    'label' => \Carbon\Carbon::parse($date)
                        ->locale('fr')
                        ->isoFormat('dddd D MMMM YYYY'),
                    'items' => $items->map(fn ($n) => [
                        'id' => $n->id,
                        'type' => $n->type,
                        'title' => $n->title,
                        'body' => $n->body,
                        'created_at' => $n->created_at,
                        'read_at' => $n->read_at,
                        'action_url' => $n->action_url,
                        'actor' => $this->resolveActor($n),
                    ])->values(),
                ];
            })
            ->values();

        return response()->json(['history' => $notifications]);
    }
}