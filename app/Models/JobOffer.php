<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobOffer extends Model
{
    protected $fillable = [
        'company_id', 'created_by', 'title', 'description', 'offer_type', 'duration_text',
        'remote', 'country', 'city', 'salary_min', 'salary_max', 'currency', 'criteria',
        'application_deadline', 'status',
    ];

    protected $casts = [
        'remote' => 'boolean',
        'application_deadline' => 'date',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function skills()
    {
        return $this->belongsToMany(Skill::class, 'job_offer_skill')
                     ->withPivot('min_level')->withTimestamps();
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
    }
}