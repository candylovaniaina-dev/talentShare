<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Proposal extends Model
{
    protected $fillable = [
        'resource_request_id', 'professional_profile_id', 'proposed_by_company_id',
        'message', 'match_score', 'status', 'sent_at', 'viewed_at', 'responded_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'viewed_at' => 'datetime',
        'responded_at' => 'datetime',
    ];

    public function resourceRequest()
    {
        return $this->belongsTo(ResourceRequest::class);
    }

    public function profile()
    {
        return $this->belongsTo(ProfessionalProfile::class, 'professional_profile_id');
    }

    public function proposingCompany()
    {
        return $this->belongsTo(Company::class, 'proposed_by_company_id');
    }

    public function mission()
    {
        return $this->hasOne(Mission::class);
    }
}