<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Skill extends Model
{
    protected $fillable = ['skill_category_id', 'name', 'slug', 'description', 'position'];

    public function category()
    {
        return $this->belongsTo(SkillCategory::class, 'skill_category_id');
    }

    public function profiles()
    {
        return $this->belongsToMany(ProfessionalProfile::class, 'profile_skills')
                     ->withPivot(['level', 'years_experience', 'notes', 'is_featured'])
                     ->withTimestamps();
    }
}