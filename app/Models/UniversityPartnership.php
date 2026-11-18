<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UniversityPartnership extends Model
{
    protected $guarded = [];

    protected $casts = ['started_at' => 'datetime', 'ended_at' => 'datetime'];

    public function university(): BelongsTo { return $this->belongsTo(University::class); }
    public function company(): BelongsTo    { return $this->belongsTo(Company::class); }
}
