<?php

namespace App\Events;

use App\Models\AvailabilityWindow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AvailabilityChanged
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public AvailabilityWindow $window,
        public string $action = "created"
    ) {
    }
}