<?php

namespace App\Jobs;

use App\Models\SavedSearch;
use App\Models\ProfessionalProfile;
use App\Services\MatchingService;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class NotifySavedSearchMatches implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(MatchingService $matcher, NotificationService $notifications): void
    {
        foreach (SavedSearch::where('notify_on_match', true)->cursor() as $search) {
            $criteria = $search->criteria;

            $matches = ProfessionalProfile::where('visibility', 'public')
                ->where('created_at', '>=', now()->subHours(24))
                ->with(['skills', 'availabilityWindows'])
                ->limit(50)
                ->get()
                ->map(fn ($p) => [
                    'profile' => $p,
                    'score' => $matcher->scoreSearch($p, $criteria, $search->user_id, 'profile'),
                ])
                ->filter(fn ($m) => $m['score'] !== null && $m['score'] >= 70)
                ->sortByDesc('score')
                ->take(5);

            if ($matches->isEmpty()) continue;

            $notifications->notify(
                $search->user,
                'saved_search_match',
                '🎯 Nouveaux talents pour "' . $search->name . '"',
                $matches->count() . ' nouveau(x) profil(s) correspond(ent) à votre recherche sauvegardée.',
                null,
                ['saved_search_id' => $search->id]
            );

            $search->update(['last_run_at' => now()]);
        }
    }
}