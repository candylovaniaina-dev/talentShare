<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Program extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'department_id',
        'name',
        'slug',
        'description',
        'level',
        'duration_months',
        'language',
        'tuition_fee',
        'currency',
        'is_active',
    ];

    protected $casts = [
        'tuition_fee'     => 'decimal:2',
        'duration_months' => 'integer',
        'is_active'       => 'boolean',
    ];

    // ─── Relations ──────────────────────────────────────────

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
}