<?php

namespace App\Console\Commands;

use App\Models\Mission;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class CloseExpiredContracts extends Command
{
    protected $signature   = 'contracts:close-expired';
    protected $description = 'Démarre les contrats arrivés à leur début et termine ceux arrivés à leur fin';

    public function handle(NotificationService $notifications): int
    {
        // 1. Recrutement direct dont la date de début est atteinte -> en cours
        Mission::where('status', 'planned')
            ->whereNull('supplying_company_id')
            ->whereDate('start_at', '<=', today())
            ->update(['status' => 'active']);

        // 2. Contrats à durée déterminée arrivés à terme -> terminés
        Mission::with(['profile.user', 'requestingCompany.owner'])
            ->whereIn('status', ['active', 'planned'])
            ->whereNotNull('end_at')
            ->whereDate('end_at', '<', today())
            ->each(function (Mission $m) use ($notifications) {
                $m->update(['status' => 'completed']);

                if ($m->requesting_company_id && $m->profile?->user_id && !$m->supplying_company_id) {
                    \App\Models\Employee::where('company_id', $m->requesting_company_id)
                        ->where('user_id', $m->profile->user_id)
                        ->update(['status' => 'ended']);
                }

                try {
                    $title = $m->title ?? 'Mission';
                    if ($m->profile?->user) {
                        $notifications->notify($m->profile->user, 'mission_completed', '🏁 Contrat terminé',
                            "Votre contrat « {$title} » est arrivé à son terme. Vous pouvez laisser une évaluation.",
                            $m, ['url' => "/missions/{$m->id}", 'mission_id' => $m->id]);
                    }
                    if ($m->requestingCompany?->owner) {
                        $notifications->notify($m->requestingCompany->owner, 'mission_completed', '🏁 Contrat terminé',
                            "Le contrat « {$title} » est arrivé à son terme. Pensez à évaluer le talent.",
                            $m, ['url' => "/missions/{$m->id}", 'mission_id' => $m->id]);
                    }
                } catch (\Exception $e) {
                    \Log::warning('Notif fin de contrat : ' . $e->getMessage());
                }
            });

        $this->info('Contrats mis à jour.');
        return self::SUCCESS;
    }
}