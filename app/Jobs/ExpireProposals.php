<?php

namespace App\Jobs;

use App\Models\Proposal;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ExpireProposals implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $count = Proposal::whereIn('status', ['sent', 'viewed'])
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now()->startOfDay())
            ->update([
                'status' => 'expired',
                'responded_at' => now(),
            ]);

        if ($count > 0) {
            \Log::info("ExpireProposals: {$count} propositions expirées.");
        }
    }
}