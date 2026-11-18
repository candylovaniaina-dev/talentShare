<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UniversityProgram extends Model
{
    protected $guarded = [];

    protected $casts = ['skills' => 'array'];

    public function department(): BelongsTo { return $this->belongsTo(UniversityDepartment::class, 'department_id'); }
    public function students(): HasMany     { return $this->hasMany(UniversityStudent::class, 'program_id'); }
}
