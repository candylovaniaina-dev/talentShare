<?php

namespace App\Jobs;

use App\Models\AvailabilityWindow;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CheckExpiringAvailability implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(NotificationService $notifications): void
    {
        // Dispos qui se terminent dans exactement 3 jours
        $expiring = AvailabilityWindow::where('status', 'available')
            ->whereDate('end_at', now()->addDays(3)->toDateString())
            ->with('profile.user')
            ->get();

        foreach ($expiring as $window) {
            if (!$window->profile?->user) continue;

            $notifications->notify(
                $window->profile->user,
                'availability_expiring',
                '⏰ Votre disponibilité expire bientôt',
                "Elle se termine dans 3 jours (" . \Carbon\Carbon::parse($window->end_at)->format('d/m/Y') . "). Pensez à la prolonger si vous êtes toujours disponible.",
                $window
            );
        }
    }
}