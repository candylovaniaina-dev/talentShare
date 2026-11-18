<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UniversityStudent extends Model
{
    protected $guarded = [];

    protected $casts = ['verified_at' => 'datetime', 'placement_start' => 'date:Y-m-d'];

    public function university(): BelongsTo { return $this->belongsTo(University::class); }
    public function user(): BelongsTo       { return $this->belongsTo(User::class); }
    public function program(): BelongsTo    { return $this->belongsTo(UniversityProgram::class, 'program_id'); }
    public function conventions(): HasMany  { return $this->hasMany(UniversityConvention::class, 'student_id'); }
}
