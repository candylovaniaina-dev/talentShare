<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mission extends Model
{
    protected $fillable = [
        'title',
        'proposal_id',
        'job_offer_id',
        'resource_offer_id',
        'requesting_company_id',
        'supplying_company_id',
        'professional_profile_id',
        'start_at',
        'end_at',
        'workload_percent',
        'remote',
        'status',
        'contract_type',
        'is_trial',
        'trial_ends_at',
    ];

    protected $casts = [
        'start_at'         => 'date',
        'end_at'           => 'date',
        'trial_ends_at'    => 'date',
        'remote'           => 'boolean',
        'workload_percent' => 'integer',
        'is_trial'         => 'boolean',
    ];

    public const STATUSES = [
        'pending_employee' => 'En attente du salarié',
        'trial'            => 'Période d\'essai',
        'planned'          => 'Acceptée',
        'active'           => 'En cours',
        'completed'        => 'Terminée',
        'cancelled'        => 'Annulée',
    ];

    public const CONTRACT_TYPES = [
        'internship'     => 'Stage',
        'apprenticeship' => 'Alternance',
        'fixed_term'     => 'CDD',
        'permanent'      => 'CDI',
        'sharing'        => 'Partage de talent',
    ];

    /** Rétro-compatibilité : déduit le type pour les anciennes missions */
    public function getContractTypeAttribute($value)
    {
        if ($value) return $value;
        if ($this->is_trial) return 'permanent';
        if ($this->supplying_company_id) return 'sharing';
        return null;
    }

    public function proposal()          { return $this->belongsTo(Proposal::class); }
    public function requestingCompany() { return $this->belongsTo(Company::class, 'requesting_company_id'); }
    public function supplyingCompany()  { return $this->belongsTo(Company::class, 'supplying_company_id'); }
    public function profile()           { return $this->belongsTo(ProfessionalProfile::class, 'professional_profile_id'); }
    public function professionalProfile(){ return $this->belongsTo(ProfessionalProfile::class); }
    public function resourceOffer()     { return $this->belongsTo(ResourceOffer::class, 'resource_offer_id'); }
    public function jobOffer()          { return $this->belongsTo(JobOffer::class); }
    public function ratings()           { return $this->hasMany(Rating::class); }
    public function documents()         { return $this->morphMany(Document::class, 'documentable'); }
}