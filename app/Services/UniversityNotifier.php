<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;

/** P0-18 — Point d'entrée unique des notifications du module Université (délègue à NotificationService::notify). */
class UniversityNotifier
{
    public static function send(?int $userId, string $type, string $title, string $body = '', array $data = []): void
    {
        if (! $userId) {
            return;
        }

        try {
            $user = User::find($userId);
            if ($user) {
                app(NotificationService::class)->notify($user, $type, $title, $body ?: null, null, $data ?: null);
            }
        } catch (\Throwable $e) {
            Log::warning('[UniversityNotifier] ' . $e->getMessage());
        }
    }
}
