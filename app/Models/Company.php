<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Company extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'owner_user_id', 'name', 'slug', 'description', 'industry', 'size',
        'country', 'city', 'address', 'latitude', 'longitude', 'website',
        'logo_path', 'is_verified',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function members()
    {
        return $this->hasMany(CompanyMember::class);
    }

    public function resourceOffers()
    {
        return $this->hasMany(ResourceOffer::class);
    }

    public function resourceRequests()
    {
        return $this->hasMany(ResourceRequest::class);
    }

    public function jobOffers()
    {
        return $this->hasMany(JobOffer::class);
    }

   public function verificationRequests()
{
    return $this->morphMany(VerificationRequest::class, 'verifiable');
}
// Dans app/Models/Company.php
public function employees()
{
    return $this->hasMany(Employee::class);
}

public function users()
{
    return $this->belongsToMany(User::class, 'employees')
                ->withPivot('position', 'status')
                ->withTimestamps();
}
public function sentProposals()
{
    return $this->hasMany(Proposal::class, 'proposed_by_company_id');
}

public function receivedProposals()
{
    return $this->hasMany(Proposal::class, 'to_company_id');
}
}