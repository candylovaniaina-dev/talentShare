<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class University extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_user_id',
        'name',
        'slug',
        'description',
        'country',
        'city',
        'address',
        'latitude',
        'longitude',
        'website',
        'logo_path',
        'is_verified',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'latitude'    => 'decimal:7',
        'longitude'   => 'decimal:7',
    ];

    // ─── Relations ──────────────────────────────────────────

    /**
     * Le propriétaire (utilisateur) de l'université.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    /**
     * Les facultés de cette université.
     */
    public function faculties(): HasMany
    {
        return $this->hasMany(Faculty::class);
    }

    /**
     * Les entreprises partenaires de cette université.
     */
    public function partnerCompanies(): BelongsToMany
    {
        return $this->belongsToMany(Company::class, 'university_company')
            ->withPivot(['status', 'contract_type', 'started_at', 'ended_at', 'notes'])
            ->withTimestamps();
    }
}