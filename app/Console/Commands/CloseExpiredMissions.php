<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Mission;
use App\Services\NotificationService;

class CloseExpiredMissions extends Command
{
    protected $signature = 'missions:close-expired';
    protected $description = 'Clôture automatiquement les missions dont la date de fin est dépassée';

    public function handle(NotificationService $notifications)
    {
        // On cherche les missions "active" ou "planned" dont la date de fin est passée
        $missions = Mission::whereIn('status', ['active', 'planned'])
            ->whereNotNull('end_at')
            ->where('end_at', '<', now()->startOfDay())
            ->get();

        foreach ($missions as $mission) {
            $mission->update(['status' => 'completed']);

            // ✅ Notification au Talent
            if ($mission->profile?->user) {
                $notifications->notify(
                    $mission->profile->user,
                    'mission_completed',
                    '🏁 Mission terminée',
                    "La mission « " . ($mission->title ?? 'Mission') . " » est maintenant terminée. Vous pouvez évaluer votre expérience.",
                    $mission,
                    ['url' => "/missions/{$mission->id}", 'mission_id' => $mission->id]
                );
            }

            // ✅ Notification à l'Entreprise demandeuse (Recruteur)
            if ($mission->requestingCompany?->owner) {
                $notifications->notify(
                    $mission->requestingCompany->owner,
                    'mission_completed',
                    '🏁 Mission terminée',
                    "La mission « " . ($mission->title ?? 'Mission') . " » avec {$mission->profile?->user?->name} est terminée. Pensez à évaluer le talent.",
                    $mission,
                    ['url' => "/missions/{$mission->id}", 'mission_id' => $mission->id]
                );
            }

            // ✅ Notification à l'Entreprise fournisseuse (si c'est un prêt)
            if ($mission->supplyingCompany?->owner && $mission->supplying_company_id !== $mission->requesting_company_id) {
                $notifications->notify(
                    $mission->supplyingCompany->owner,
                    'mission_completed',
                    '🏁 Mission terminée',
                    "La mission « " . ($mission->title ?? 'Mission') . " » pour {$mission->profile?->user?->name} est terminée.",
                    $mission,
                    ['url' => "/missions/{$mission->id}", 'mission_id' => $mission->id]
                );
            }

            $this->info("Mission #{$mission->id} clôturée automatiquement.");
        }

        $this->info('Vérification terminée.');
    }
}