<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PortfolioProject extends Model
{
    protected $fillable = [
        'portfolio_id', 'title', 'description', 'project_url',
        'start_date', 'end_date', 'technologies', 'project_type',
    ];

    protected $casts = [
        'technologies' => 'array',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function portfolio()
    {
        return $this->belongsTo(Portfolio::class);
    }

    /**
     * Scope : projets universitaires
     */
    public function scopeAcademic($query)
    {
        return $query->where('project_type', 'academic');
    }

    /**
     * Scope : projets personnels
     */
    public function scopePersonal($query)
    {
        return $query->where('project_type', 'personal');
    }
}