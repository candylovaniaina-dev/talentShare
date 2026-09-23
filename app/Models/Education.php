<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Education extends Model
{
    protected $table = 'educations';

    protected $fillable = [
        'professional_profile_id', 'institution', 'degree', 'field_of_study',
        'study_level', 'start_date', 'end_date', 'is_current', 'is_young_talent',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_current' => 'boolean',
        'is_young_talent' => 'boolean',
    ];

    public function profile()
    {
        return $this->belongsTo(ProfessionalProfile::class, 'professional_profile_id');
    }
}