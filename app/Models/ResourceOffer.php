<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ResourceOffer extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'company_id', 'professional_profile_id', 'title', 'description',
        'mission_type', 'start_at', 'end_at',
        'workload_percent', 'workload_unit', 'workload_value',
        'remote', 'location_type', 'location_city',
        'country', 'city', 'visibility', 'status',
        'conditions', 'daily_rate', 'hourly_rate',
    ];

    protected $casts = [
        'start_at' => 'date',
        'end_at'   => 'date',
        'remote'   => 'boolean',
    ];

    // ✅ Relations
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function profile()
    {
        return $this->belongsTo(ProfessionalProfile::class, 'professional_profile_id');
    }

    public function skills()
    {
        return $this->belongsToMany(Skill::class, 'resource_offer_skill')
                    ->withPivot('level');
    }

    // ✅ NOUVEAU : toutes les missions liées
    public function missions()
    {
        return $this->hasMany(Mission::class);
    }

    // ✅ NOUVEAU : mission active (pending / planned / active)
    public function activeMission()
    {
        return $this->hasOne(Mission::class)
            ->whereIn('status', ['pending_employee', 'planned', 'active'])
            ->latestOfMany();
    }

    // ✅ Scopes
    public function scopePublished($query)
    {
        return $query->where('status', 'published')
                     ->where('end_at', '>=', now()->startOfDay());
    }

    public function scopePublic($query)
    {
        return $query->where('visibility', 'public');
    }

    // ✅ NOUVEAU : statut dérivé pour l'affichage
    public function getDisplayStatusAttribute()
    {
        $mission = $this->relationLoaded('activeMission')
            ? $this->activeMission
            : $this->activeMission()->first();

        if ($mission) {
            return match ($mission->status) {
                'pending_employee' => 'mission_pending',
                'planned'          => 'mission_planned',
                'active'           => 'mission_active',
                default            => $this->status,
            };
        }

        return $this->status;
    }
}