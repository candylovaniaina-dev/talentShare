<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Portfolio extends Model
{
    protected $fillable = [
        'professional_profile_id',
        'public_slug',
        'title',
        'summary',
        'visibility',
         'theme', 'accent_color',
    ];

    protected $casts = [
        'visibility' => 'string',
    ];

    public function profile()
    {
        return $this->belongsTo(ProfessionalProfile::class, 'professional_profile_id');
    }

    public function projects()
    {
        return $this->hasMany(PortfolioProject::class)->orderBy('position', 'asc');
    }

    // Générer un slug unique
    public static function generateSlug($name, $profileId)
    {
        $base = Str::slug($name);
        $slug = $base . '-' . Str::random(6);
        
        // Vérifier l'unicité
        while (self::where('public_slug', $slug)->where('professional_profile_id', '!=', $profileId)->exists()) {
            $slug = $base . '-' . Str::random(6);
        }
        
        return $slug;
    }
}