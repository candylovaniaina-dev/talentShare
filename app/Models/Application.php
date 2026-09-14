<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    protected $fillable = [
        'job_offer_id', 'professional_profile_id', 'portfolio_id',
        'cover_letter', 'cv_path', 'status',
    ];

    public function jobOffer()
    {
        return $this->belongsTo(JobOffer::class);
    }

    public function profile()
    {
        return $this->belongsTo(ProfessionalProfile::class, 'professional_profile_id');
    }

    public function portfolio()
    {
        return $this->belongsTo(Portfolio::class);
    }
}