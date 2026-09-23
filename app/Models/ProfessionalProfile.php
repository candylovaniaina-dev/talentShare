<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProfessionalProfile extends Model
{
    protected $fillable = [
        'user_id', 'profile_type', 'headline', 'bio', 'visibility',
        'country', 'city', 'portfolio_url', 'cv_path', 'is_verified',
        'avatar_path', 'linkedin_url', 'github_url', 'behance_url',
        // Young Talent fields
        'university', 'field_of_study', 'study_level',
        'is_young_talent', 'looking_for_opportunity',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'is_young_talent' => 'boolean',
        'looking_for_opportunity' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function skills()
    {
        return $this->belongsToMany(Skill::class, 'profile_skills')
                     ->withPivot(['level', 'years_experience', 'notes', 'is_featured'])
                     ->withTimestamps();
    }

    public function availabilityWindows()
    {
        return $this->hasMany(AvailabilityWindow::class);
    }

    public function portfolio()
    {
        return $this->hasOne(Portfolio::class);
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    public function experiences() { return $this->hasMany(Experience::class)->orderByDesc('start_date'); }
    public function educations() { return $this->hasMany(Education::class)->orderByDesc('start_date'); }
    public function certifications() { return $this->hasMany(Certification::class)->orderByDesc('issue_date'); }
    public function languages() { return $this->hasMany(Language::class); }

    /**
     * Scope : uniquement les jeunes talents
     */
    public function scopeYoungTalents($query)
    {
        return $query->where('is_young_talent', true)
                     ->orWhere('profile_type', 'student');
    }

    /**
     * Scope : jeunes talents en recherche d'opportunités
     */
    public function scopeLookingForOpportunity($query)
    {
        return $query->where('looking_for_opportunity', true);
    }
}