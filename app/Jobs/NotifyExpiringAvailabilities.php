<?php

namespace App\Jobs;

use App\Models\AvailabilityWindow;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class NotifyExpiringAvailabilities implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(NotificationService $notifications): void
    {
        $target = Carbon::now()->addDays(7)->startOfDay();

        // ✅ Dispos qui expirent dans EXACTEMENT 7 jours
        $expiring = AvailabilityWindow::with('profile.user')
            ->whereDate('end_at', $target)
            ->where('status', '!=', 'unavailable')
            ->get();

        foreach ($expiring as $window) {
            $user = $window->profile?->user;
            if (!$user) continue;

            $notifications->notify(
                $user,
                'availability_expiring',
                '⏳ Votre disponibilité expire bientôt',
                "Votre disponibilité du " .
                Carbon::parse($window->start_at)->format('d/m/Y') . " au " .
                Carbon::parse($window->end_at)->format('d/m/Y') .
                " expire dans 7 jours. Pensez à la renouveler.",
                $window,
                ['availability_window_id' => $window->id]
            );
        }
    }
}