<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResourceRequest extends Model
{
    protected $fillable = [
        'company_id', 'created_by', 'title', 'description', 'start_at', 'end_at',
        'workload_percent', 'remote', 'country', 'city', 'status', 'expires_at',
    ];

    protected $casts = [
        'start_at' => 'date',
        'end_at' => 'date',
        'expires_at' => 'date',
        'remote' => 'boolean',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function skills()
    {
        return $this->belongsToMany(Skill::class, 'resource_request_skill')
                     ->withPivot('min_level')->withTimestamps();
    }

    public function proposals()
    {
        return $this->hasMany(Proposal::class);
    }
}