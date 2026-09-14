<?php

use App\Providers\AppServiceProvider;

return [
    AppServiceProvider::class,
    App\Providers\EventServiceProvider::class,  // ✅ AJOUTE
    App\Providers\RouteServiceProvider::class,
];
