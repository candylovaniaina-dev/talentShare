<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Department extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'faculty_id',
        'name',
        'slug',
        'description',
    ];

    // ─── Relations ──────────────────────────────────────────

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }

    public function programs(): HasMany
    {
        return $this->hasMany(Program::class);
    }

    public function university(): BelongsTo
    {
        return $this->faculty->university();
    }
}