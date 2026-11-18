<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class University extends Model
{
    protected $guarded = [];

    protected $casts = ['latitude' => 'float', 'longitude' => 'float'];

    public function owner(): BelongsTo        { return $this->belongsTo(User::class, 'user_id'); }
    public function members(): HasMany        { return $this->hasMany(UniversityMember::class); }
    public function departments(): HasMany    { return $this->hasMany(UniversityDepartment::class); }
    public function programs(): HasMany       { return $this->hasMany(UniversityProgram::class); }
    public function students(): HasMany       { return $this->hasMany(UniversityStudent::class); }
    public function partnerships(): HasMany   { return $this->hasMany(UniversityPartnership::class); }
    public function opportunities(): HasMany  { return $this->hasMany(UniversityOpportunity::class); }
    public function conventions(): HasMany    { return $this->hasMany(UniversityConvention::class); }
}
