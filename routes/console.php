<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Jobs\NotifySavedSearchMatches;
Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
Schedule::job(new \App\Jobs\CheckExpiringAvailability)->dailyAt('09:00');



Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ✅ P0-8 : Notifier les nouveaux matchs toutes les heures
Schedule::job(new NotifySavedSearchMatches)->hourly();