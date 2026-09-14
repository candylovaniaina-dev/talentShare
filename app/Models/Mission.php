<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mission extends Model
{
    protected $fillable = [
        'proposal_id',
        'requesting_company_id',
        'supplying_company_id',
        'professional_profile_id',
        'resource_offer_id',
        'start_at',
        'end_at',
        'workload_percent',
        'remote',
        'status',
    ];

    protected $casts = [
        'start_at' => 'date',
        'end_at' => 'date',
        'remote' => 'boolean',
        'workload_percent' => 'integer',
    ];

    // ✅ Statuts
    public const STATUSES = [
        'pending_employee' => 'En attente du salarié',
        'planned'          => 'Acceptée',
        'active'           => 'En cours',
        'completed'        => 'Terminée',
        'cancelled'        => 'Annulée',
    ];

    // Relations
    public function proposal()
    {
        return $this->belongsTo(Proposal::class);
    }

    public function requestingCompany()
    {
        return $this->belongsTo(Company::class, 'requesting_company_id');
    }

    public function supplyingCompany()
    {
        return $this->belongsTo(Company::class, 'supplying_company_id');
    }

    public function profile()
    {
        return $this->belongsTo(ProfessionalProfile::class, 'professional_profile_id');
    }

    public function resourceOffer()
    {
        return $this->belongsTo(ResourceOffer::class, 'resource_offer_id');
    }

    public function ratings()
    {
        return $this->hasMany(Rating::class);
    }

    public function documents()
    {
        return $this->morphMany(Document::class, 'documentable');
    }
}