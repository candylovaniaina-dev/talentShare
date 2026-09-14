<?php

namespace App\Listeners;

use App\Events\AvailabilityChanged;
use App\Models\Company;
use App\Models\Notification;
use App\Services\NotificationService;

class NotifyAvailabilityChange
{
    public function __construct(protected NotificationService $notifications) {}

    public function handle(AvailabilityChanged $event): void
    {
        $window  = $event->window;
        $profile = $window->profile;

        if (!$profile || !$profile->user) return;

        // ✅ Ne notifier que si le talent est DISPONIBLE
        if ($window->status !== 'available') return;

        // Récupérer les IDs des compétences du talent
        $talentSkills = $profile->skills()->pluck('skills.id')->toArray();
        if (empty($talentSkills)) return;

        // Trouver les entreprises qui ont une resource_request publiée
        // ET dont les compétences matchent celles du talent
        $companies = Company::whereHas('resourceRequests', function ($q) use ($talentSkills) {
            $q->where('status', 'published')
              ->whereHas('skills', fn ($s) => $s->whereIn('skills.id', $talentSkills));
        })->with('owner')->get();

        foreach ($companies as $company) {
            if (!$company->owner) continue;

            // Éviter les doublons récents (< 24h) pour la même availability
            $alreadyNotified = Notification::where('user_id', $company->owner->id)
                ->where('type', 'talent_available')
                ->where('subject_type', AvailabilityWindow::class)
                ->where('subject_id', $window->id)
                ->where('created_at', '>=', now()->subDay())
                ->exists();

            if ($alreadyNotified) continue;

            $start = \Carbon\Carbon::parse($window->start_at)->format('d/m/Y');
            $end   = \Carbon\Carbon::parse($window->end_at)->format('d/m/Y');

            $this->notifications->notify(
                $company->owner,
                'talent_available',
                '🎉 Un talent correspond à votre recherche',
                "{$profile->user->name} est disponible en {$window->type} du {$start} au {$end}.",
                $window
            );
        }
    }
}