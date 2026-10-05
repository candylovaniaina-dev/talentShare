<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens,HasFactory, Notifiable,SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
   protected $fillable = [
    'name',
    'email',
    'password',
    'role',
    'phone',
    'avatar_path',
    'status', 'first_name', 'last_name', 'country',
    'theme_preference', 'font_size', 'high_contrast', 'reduce_motion',
    'university_id',
    'university_status',
    'university_verified_at',
];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
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
     * Relation avec les entreprises (pour un propriétaire d'entreprise)
     */
    public function companies()
    {
        return $this->hasMany(Company::class, 'owner_user_id');
    }

    /**
     * Relation avec les universités (pour un propriétaire d'université)
     */
    public function universities()
    {
        return $this->hasMany(University::class, 'owner_user_id');
    }

    /**
     * Relation avec le profil professionnel (pour les talents)
     */
    public function professionalProfile()
    {
        return $this->hasOne(ProfessionalProfile::class);
    }

    // ==================== MÉTHODES UTILITAIRES ====================

    /**
     * Vérifier si l'utilisateur est une entreprise
     */
    public function isCompany(): bool
    {
        return $this->role === 'company';
    }

    /**
     * Vérifier si l'utilisateur est un talent (salarié/étudiant)
     */
   public function isTalent(): bool
{
    return $this->role === 'employee' || $this->role === 'student';
}

    /**
     * Vérifier si l'utilisateur est une université
     */
    public function isUniversity(): bool
    {
        return $this->role === 'university';
    }

    /**
     * Vérifier si l'utilisateur est un administrateur
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Vérifier si le compte est actif
     */
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
    /**
     * L'université à laquelle l'utilisateur est rattaché.
     */
    public function university(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(University::class);
    }

    /**
     * Vérifie si l'utilisateur est un étudiant.
     */
    public function isStudent(): bool
    {
        return $this->role === 'student';
    }

    /**
     * Vérifie si le profil étudiant est vérifié par l'université.
     */
    public function isUniversityVerified(): bool
    {
        return $this->university_verified_at !== null;
    }
}