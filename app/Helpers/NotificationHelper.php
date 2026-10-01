<?php

namespace App\Helpers;

use App\Models\Notification;

class NotificationHelper
{
    /**
     * Créer une notification custom
     */
    public static function create(
        int $userId,
        string $type,
        string $title,
        string $body,
        ?string $subjectType = null,
        ?int $subjectId = null,
        ?array $data = null
    ): Notification {
        return Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'data' => $data ? json_encode($data) : null,
        ]);
    }
}