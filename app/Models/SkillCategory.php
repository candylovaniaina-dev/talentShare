<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SkillCategory extends Model
{
    protected $fillable = ['name', 'slug', 'parent_id', 'icon', 'position', 'description'];

    public function parent()
    {
        return $this->belongsTo(SkillCategory::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(SkillCategory::class, 'parent_id')
                    ->orderBy('position')
                    ->orderBy('name');
    }

    public function skills()
    {
        return $this->hasMany(Skill::class, 'skill_category_id')
                    ->orderBy('position')
                    ->orderBy('name');
    }
}