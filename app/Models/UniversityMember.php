<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UniversityMember extends Model
{
    protected $guarded = [];

    public function university(): BelongsTo { return $this->belongsTo(University::class); }
    public function user(): BelongsTo       { return $this->belongsTo(User::class); }
}
