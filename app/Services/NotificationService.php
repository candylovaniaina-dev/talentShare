<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class NotificationService
{
    /**
     * Envoyer une notification
     */
    public function notify(
        User $user,
        string $type,
        string $title,
        ?string $body = null,
        ?Model $subject = null,
        ?array $data = null
    ): Notification {
        return Notification::create([
            'user_id'      => $user->id,
            'type'         => $type,
            'title'        => $title,
            'body'         => $body,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id'   => $subject?->id,
            'data'         => $data ? json_encode($data) : null,
        ]);
    }

    /**
     * Notifier tous les autres utilisateurs (broadcast) quand une offre est publiée
     */
    public function notifyAllExcept(User $except, string $type, string $title, ?string $body = null, ?Model $subject = null): void
    {
        $users = User::where('id', '!=', $except->id)
            ->whereIn('role', ['company', 'employee', 'student'])
            ->limit(100)
            ->get();

        foreach ($users as $user) {
            $this->notify($user, $type, $title, $body, $subject);
        }
    }
}