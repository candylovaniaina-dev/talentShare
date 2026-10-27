<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
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
                    'action_url' => $n->action_url,
                    'read_at' => $n->read_at,
                    'created_at' => $n->created_at,
                    'actor' => $this->resolveActor($n),
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

    protected function resolveActor(Notification $n): ?array
    {
        try {
            $subject = $n->subject;

            /* ============================================================
               CAS 1 : proposal_received
               ============================================================ */
            if ($n->type === 'proposal_received' && $subject) {
                $subject->loadMissing('profile.user', 'proposingCompany', 'profile');

                if ($subject->proposingCompany) {
                    return [
                        'id' => $subject->proposingCompany->id,
                        'name' => $subject->proposingCompany->name,
                        'avatar_path' => $subject->proposingCompany->logo_path,
                        'role' => 'company',
                        'type' => 'company',
                    ];
                }

                $talentUser = $subject->profile?->user;
                if ($talentUser) {
                    return [
                        'id' => $talentUser->id,
                        'name' => $talentUser->name,
                        'avatar_path' => $subject->profile?->avatar_path ?? $talentUser->avatar_path,
                        'role' => 'candidate',
                        'type' => 'user',
                    ];
                }
            }

            /* ============================================================
               CAS 2 : proposal_accepted
               ============================================================ */
            if ($n->type === 'proposal_accepted' && $subject) {
                $subject->loadMissing('requestingCompany', 'supplyingCompany', 'profile.user');

                $company = $subject->requestingCompany;

                if ($company) {
                    return [
                        'id' => $company->id,
                        'name' => $company->name,
                        'avatar_path' => $company->logo_path,
                        'role' => 'company',
                        'type' => 'company',
                    ];
                }

                $talentUser = $subject->profile?->user;
                if ($talentUser) {
                    return [
                        'id' => $talentUser->id,
                        'name' => $talentUser->name,
                        'avatar_path' => $subject->profile?->avatar_path ?? $talentUser->avatar_path,
                        'role' => 'candidate',
                        'type' => 'user',
                    ];
                }
            }

            /* ============================================================
               CAS 3 : proposal_declined
               ============================================================ */
            if ($n->type === 'proposal_declined' && $subject) {
                $subject->loadMissing('toCompany', 'resourceRequest.company');

                $company = $subject->toCompany ?? $subject->resourceRequest?->company;

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

            /* ============================================================
               CAS 4 : application_*
               ============================================================ */
            if (str_contains($n->subject_type ?? '', 'Application') && $subject) {
                $subject->loadMissing('jobOffer.company', 'profile.user');
                $company = $subject->jobOffer?->company;
                $candidate = $subject->profile?->user;

                if ($n->type === 'new_application' && $candidate) {
                    return [
                        'id' => $candidate->id,
                        'name' => $candidate->name,
                        'avatar_path' => $candidate->professionalProfile?->avatar_path ?? $candidate->avatar_path,
                        'role' => 'candidate',
                        'type' => 'user',
                    ];
                }

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

            /* ============================================================
               CAS 5 : JobOffer
               ============================================================ */
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

            /* ============================================================
               CAS 6 : new_message
               ============================================================ */
            if ($n->type === 'new_message' && is_array($n->data) && isset($n->data['sender_id'])) {
                $sender = \App\Models\User::find($n->data['sender_id']);
                if ($sender) {
                    // 👇 ON CHARGE L'ENTREPRISE ET LE PROFIL
                    $sender->loadMissing('professionalProfile', 'company');
                    
                    // 👇 ON CHERCHE LE LOGO EN PRIORITÉ
                    $avatar = $sender->company?->logo_path 
                           ?? $sender->professionalProfile?->avatar_path 
                           ?? $sender->avatar_path;

                    return [
                        'id' => $sender->id,
                        'name' => $sender->name,
                        'avatar_path' => $avatar,
                        'role' => $sender->role === 'company' ? 'company' : 'user',
                        'type' => $sender->role === 'company' ? 'company' : 'user',
                    ];
                }
            }

            /* ============================================================
               CAS 7 : offer_liked / offer_commented
               ============================================================ */
            if (in_array($n->type, ['offer_liked', 'offer_commented'])
                && is_array($n->data) && isset($n->data['actor_id'])) {
                $actor = \App\Models\User::find($n->data['actor_id']);
                if ($actor) {
                    // 👇 ON CHARGE L'ENTREPRISE ET LE PROFIL
                    $actor->loadMissing('professionalProfile', 'company');
                    
                    // 👇 ON CHERCHE LE LOGO EN PRIORITÉ
                    $avatar = $actor->company?->logo_path 
                           ?? $actor->professionalProfile?->avatar_path 
                           ?? $actor->avatar_path;

                    return [
                        'id' => $actor->id,
                        'name' => $actor->name,
                        'avatar_path' => $avatar,
                        'role' => $actor->role === 'company' ? 'company' : 'user',
                        'type' => $actor->role === 'company' ? 'company' : 'user',
                    ];
                }
            }

            /* ============================================================
               ✅ CAS 8 : resource_request_published / request_liked / request_commented
               ============================================================ */
            if (is_array($n->data) && isset($n->data['actor_id'])) {
                $actor = \App\Models\User::find($n->data['actor_id']);
                if ($actor) {
                    // 👇 ON CHARGE L'ENTREPRISE ET LE PROFIL
                    $actor->loadMissing('professionalProfile', 'company');
                    
                    // 👇 ON CHERCHE LE LOGO EN PRIORITÉ
                    $avatar = $actor->company?->logo_path 
                           ?? $actor->professionalProfile?->avatar_path 
                           ?? $actor->avatar_path;

                    return [
                        'id' => $actor->id,
                        'name' => $actor->name,
                        'avatar_path' => $avatar,
                        'role' => $actor->role === 'company' ? 'company' : 'user',
                        'type' => $actor->role === 'company' ? 'company' : 'user',
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
                        'subject_id' => $n->subject_id,
                        'subject_type' => $n->subject_type,
                        
                        'actor' => $this->resolveActor($n),
                    ])->values(),
                ];
            })
            ->values();

        return response()->json(['history' => $notifications]);
    }
}