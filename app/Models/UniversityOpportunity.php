<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UniversityOpportunity extends Model
{
    protected $guarded = [];

    protected $casts = ['deadline' => 'date:Y-m-d'];

    public function university(): BelongsTo { return $this->belongsTo(University::class); }
    public function company(): BelongsTo    { return $this->belongsTo(Company::class); }
    public function program(): BelongsTo    { return $this->belongsTo(UniversityProgram::class, 'program_id'); }
}
