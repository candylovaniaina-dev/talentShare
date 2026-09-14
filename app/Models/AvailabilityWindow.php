<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AvailabilityWindow extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'professional_profile_id',
        'start_at',
        'end_at',
        'status',
        'type',
        'workload_percent',
        'workload_unit',
        'workload_value',
        'remote',
        'location_type',
        'location_city',
        'notes',
        'is_recurring',
        'recurrence_pattern',
    ];

    protected $casts = [
        'start_at'         => 'date',
        'end_at'           => 'date',
        'remote'           => 'boolean',
        'is_recurring'     => 'boolean',
        'workload_percent' => 'integer',
        'workload_value'   => 'integer',
    ];

    // Statuts
    public const STATUSES = [
        'available'            => 'Disponible',
        'partially_available'  => 'Partiellement disponible',
        'unavailable'          => 'Non disponible',
        'on_mission'           => 'En mission',
    ];

    // Types
    public const TYPES = [
        'full_time'  => 'Temps plein',
        'part_time'  => 'Temps partiel',
        'freelance'  => 'Freelance',
        'internship' => 'Stage',
        'mission'    => 'Mission',
    ];

    // Localisations
    public const LOCATIONS = [
        'onsite' => 'Sur site',
        'remote' => 'Télétravail',
        'hybrid' => 'Hybride',
    ];

    // Unités de charge
    public const UNITS = [
        'percentage'     => '%',
        'hours_per_week' => 'h/semaine',
        'days_per_week'  => 'j/semaine',
    ];

    public function profile()
    {
        return $this->belongsTo(ProfessionalProfile::class, 'professional_profile_id');
    }

    // ============================================
    // Accessors utiles
    // ============================================

    public function getStatusLabelAttribute(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    public function getWorkloadLabelAttribute(): string
    {
        $unit = self::UNITS[$this->workload_unit] ?? '';
        return "{$this->workload_value}{$unit}";
    }

    public function getLocationLabelAttribute(): string
    {
        return self::LOCATIONS[$this->location_type] ?? $this->location_type;
    }

    public function getIsActiveAttribute(): bool
    {
        $today = now()->startOfDay();
        return $this->start_at <= $today && $this->end_at >= $today;
    }
}