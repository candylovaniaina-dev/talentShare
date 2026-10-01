<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Jobs\NotifySavedSearchMatches;
use App\Jobs\NotifyExpiringAvailabilities;
use App\Jobs\RenewRecurringAvailabilities;
use App\Jobs\ExpireResourceRequests;
use App\Jobs\ExpireProposals;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ✅ P0-8 : Notifier les nouveaux matchs (toutes les heures)
Schedule::job(new NotifySavedSearchMatches)->hourly();

// ✅ Disponibilités qui expirent dans 7 jours (chaque jour à 9h)
Schedule::job(new NotifyExpiringAvailabilities)->dailyAt('09:00');

// ✅ Renouveler les disponibilités récurrentes (chaque nuit à 00h30)
Schedule::job(new RenewRecurringAvailabilities)->dailyAt('00:30');

// ✅ P0-9 : Expiration automatique des demandes (chaque jour à 1h)
Schedule::job(new ExpireResourceRequests)->dailyAt('01:00');
Schedule::job(new ExpireProposals)->dailyAt('02:00');

// ✅ Rappels d'entretien (30 min avant, vérifié toutes les 5 min)
Schedule::command('interviews:send-reminders')->everyFiveMinutes();