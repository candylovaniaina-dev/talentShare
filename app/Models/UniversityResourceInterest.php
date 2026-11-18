<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UniversityResourceInterest extends Model
{
    protected $guarded = [];

    protected $casts = ['start_date' => 'date:Y-m-d', 'responded_at' => 'datetime'];

    public function offer(): BelongsTo   { return $this->belongsTo(UniversityResourceOffer::class, 'offer_id'); }
    public function company(): BelongsTo { return $this->belongsTo(Company::class); }
}
