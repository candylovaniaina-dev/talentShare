<?php

namespace App\Console\Commands;

use App\Models\ResourceOffer;
use App\Models\ResourceOfferWaitlist;
use App\Services\TalentMarketService;
use Illuminate\Console\Command;

class SyncTalentMarket extends Command
{
    protected $signature = 'talent-market:sync';
    protected $description = 'Libère les talents dont la mission est terminée et notifie les entreprises en attente';

    public function handle(TalentMarketService $market): int
    {
        $ids = ResourceOfferWaitlist::whereIn('status', ResourceOfferWaitlist::ACTIVE)
            ->pluck('resource_offer_id')->unique();

        foreach ($ids as $id) {
            $offer = ResourceOffer::find($id);
            if ($offer) {
                $market->syncOffer($offer);
            }
        }

        $this->info("{$ids->count()} offre(s) vérifiée(s).");

        return self::SUCCESS;
    }
}