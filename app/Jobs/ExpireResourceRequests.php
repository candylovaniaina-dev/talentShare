<?php

namespace App\Jobs;

use App\Models\ResourceRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ExpireResourceRequests implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        // ✅ Ferme toutes les demandes publiées dont expires_at est dépassé
        $count = ResourceRequest::where('status', 'published')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now()->startOfDay())
            ->update([
                'status' => 'expired',
                'closed_reason' => 'expired',
                'closed_at' => now(),
            ]);

        if ($count > 0) {
            \Log::info("ExpireResourceRequests: {$count} demandes expirées.");
        }
    }
}