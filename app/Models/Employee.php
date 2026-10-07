<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'company_id',
        'user_id',
        'position',
        'status',
        'email',
        'first_name',
        'last_name',
        'phone',
        'has_account',
        'photo_path',        // ✅ AJOUTER
    ];

    protected $casts = [
        'has_account' => 'boolean',
    ];

    // ✅ Exposer photo_url dans le JSON
    protected $appends = ['photo_url'];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * ✅ URL complète de la photo (fallback sur l'avatar du compte user)
     */
    public function getPhotoUrlAttribute(): ?string
    {
        if ($this->photo_path) {
            return asset('storage/' . $this->photo_path);
        }
        if ($this->user?->professionalProfile?->avatar_path) {
            return asset('storage/' . $this->user->professionalProfile->avatar_path);
        }
        return null;
    }
}