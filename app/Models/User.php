<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name', 'email', 'password', 'role', 'phone', 'avatar_path', 'status',
        'first_name', 'last_name', 'country', 'theme_preference', 'font_size',
        'high_contrast', 'reduce_motion', 'provider', 'provider_id', 'last_login_at',
        'proposals_last_seen_at', 'resource_requests_last_seen_at', 'job_offers_last_seen_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'high_contrast' => 'boolean',
            'reduce_motion' => 'boolean',
        ];
    }

    // ==================== RELATIONS ====================

    /**
     * ✅ Entreprises dont l'utilisateur est le PROPRIÉTAIRE (via owner_user_id).
     * Utilise une vraie relation HasMany pour que le eager loading fonctionne.
     */
    public function ownedCompanies(): HasMany
    {
        return $this->hasMany(Company::class, 'owner_user_id');
    }

    /**
     * ✅ Entreprises dont l'utilisateur est MEMBRE (via la table company_members).
     */
    public function memberCompanies(): BelongsToMany
    {
        return $this->belongsToMany(Company::class, 'company_members')
            ->withPivot('role', 'status')
            ->withTimestamps()
            ->wherePivot('status', 'active');
    }

    /**
     * ✅ Récupérer TOUTES les entreprises (Propriétaire + Membre) en une seule liste.
     * C'est cette méthode que le frontend et le contrôleur doivent utiliser.
     */
    public function getAllCompaniesAttribute()
    {
        return $this->ownedCompanies->merge($this->memberCompanies);
    }

    /**
     * ✅ On garde la méthode companies() pour compatibilité, mais on lui dit
     * de renvoyer une vraie collection (via une méthode magique ou un accessor).
     */
    public function companies()
    {
        // Renvoie une HasMany classique pour le propriétaire.
        // Pour les membres, le frontend appellera /companies/my/all
        return $this->hasMany(Company::class, 'owner_user_id');
    }

    public function company()
    {
        return $this->hasOne(Company::class, 'owner_user_id');
    }

    public function universities()
    {
        return $this->hasMany(University::class, 'owner_user_id');
    }

      public function professionalProfile(): HasOne
    {
        return $this->hasOne(ProfessionalProfile::class);
    }

    // ✅ NOUVELLE RELATION : L'employé lié à cet utilisateur
    public function employee(): HasOne
    {
        return $this->hasOne(Employee::class, 'user_id', 'id');
    }

    // ==================== MÉTHODES UTILITAIRES ====================

    public function isCompany(): bool
    {
        return $this->role === 'company';
    }

    public function isTalent(): bool
    {
        return $this->role === 'employee' || $this->role === 'student';
    }

    public function isUniversity(): bool
    {
        return $this->role === 'university';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function conversations()
    {
        return $this->belongsToMany(Conversation::class, 'conversation_participants')
                     ->withPivot('last_read_at')->withTimestamps();
    }

    public function savedSearches()
    {
        return $this->hasMany(SavedSearch::class);
    }

    public function matchInteractions()
    {
        return $this->hasMany(MatchInteraction::class);
    }

    public function matchWeights()
    {
        return $this->hasOne(MatchWeight::class);
    }
}