<?php

namespace App\Observers;

use App\Models\Mission;
use App\Services\TalentMarketService;

class MissionObserver
{
    public function saved(Mission $mission): void
    {
        if (!$mission->professional_profile_id) {
            return;
        }

        if ($mission->wasRecentlyCreated || $mission->wasChanged(['status', 'end_at', 'professional_profile_id'])) {
            $this->sync($mission->professional_profile_id);
        }
    }

    public function deleted(Mission $mission): void
    {
        if ($mission->professional_profile_id) {
            $this->sync($mission->professional_profile_id);
        }
    }

    private function sync(int $profileId): void
    {
        try {
            app(TalentMarketService::class)->syncProfile($profileId);
        } catch (\Throwable $e) {
            \Log::warning('TalentMarket sync: ' . $e->getMessage());
        }
    }
}