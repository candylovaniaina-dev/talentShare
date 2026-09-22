<?php

namespace App\Jobs;

use App\Models\AvailabilityWindow;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RenewRecurringAvailabilities implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $today = Carbon::now()->startOfDay();

        // ✅ Dispos récurrentes qui viennent d'expirer
        $expired = AvailabilityWindow::where('is_recurring', true)
            ->whereDate('end_at', $today->copy()->subDay())
            ->whereNotNull('recurrence_pattern')
            ->get();

        foreach ($expired as $window) {
            $next = $this->computeNextWindow($window);
            if (!$next) continue;

            // ✅ Crée une nouvelle dispo avec les mêmes paramètres
            AvailabilityWindow::create([
                'professional_profile_id' => $window->professional_profile_id,
                'start_at' => $next['start_at'],
                'end_at' => $next['end_at'],
                'status' => $window->status,
                'type' => $window->type,
                'workload_unit' => $window->workload_unit,
                'workload_value' => $window->workload_value,
                'workload_percent' => $window->workload_percent,
                'location_type' => $window->location_type,
                'location_city' => $window->location_city,
                'notes' => $window->notes,
                'is_recurring' => true,
                'recurrence_pattern' => $window->recurrence_pattern,
                'remote' => $window->remote,
            ]);
        }
    }

    /**
     * ✅ Calcule la prochaine fenêtre selon le pattern
     */
    private function computeNextWindow(AvailabilityWindow $window): ?array
    {
        $duration = Carbon::parse($window->start_at)->diffInDays(Carbon::parse($window->end_at));
        $start = Carbon::parse($window->end_at)->addDay();

        $end = match ($window->recurrence_pattern) {
            'weekly'   => $start->copy()->addDays(7),
            'biweekly' => $start->copy()->addDays(14),
            'monthly'  => $start->copy()->addMonth(),
            default    => null,
        };

        if (!$end) return null;

        return [
            'start_at' => $start,
            'end_at' => $end,
        ];
    }
}