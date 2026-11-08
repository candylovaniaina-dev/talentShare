<?php

namespace App\Console\Commands;

use App\Models\Proposal;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class ExpireProposals extends Command
{
    protected $signature = 'proposals:expire';
    protected $description = 'Passe en "expired" les propositions envoyées/consultées dont la date limite est dépassée';

    public function handle(NotificationService $notifications): int
    {
        $count = 0;

        Proposal::whereIn('status', ['sent', 'viewed'])
            ->whereNotNull('expires_at')
            ->whereDate('expires_at', '<', now()->toDateString())
            ->with(['proposingCompany.owner', 'profile.user'])
            ->chunkById(100, function ($rows) use ($notifications, &$count) {
                foreach ($rows as $p) {
                    try {
                        $p->update(['status' => 'expired']);
                        $count++;

                        if ($p->proposingCompany?->owner) {
                            $notifications->notify(
                                $p->proposingCompany->owner,
                                'proposal_expired',
                                '⌛ Proposition expirée',
                                'Votre proposition pour « ' . ($p->profile?->user?->name ?? 'un talent') . ' » a expiré sans réponse.',
                                $p,
                                ['url' => "/proposals/{$p->id}", 'proposal_id' => $p->id]
                            );
                        }
                    } catch (\Throwable $e) {
                        \Log::warning("proposals:expire #{$p->id} : " . $e->getMessage());
                    }
                }
            });

        $this->info("{$count} proposition(s) expirée(s).");
        return self::SUCCESS;
    }
}