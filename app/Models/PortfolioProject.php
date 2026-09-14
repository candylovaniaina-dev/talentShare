<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PortfolioProject extends Model
{
    protected $fillable = [
        'portfolio_id',
        'title',
        'description',
        'project_url',
        'cover_image_path',
        'position',
        'start_date',
        'end_date',
        'technologies',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'technologies' => 'array',
        'position' => 'integer',
    ];

    public function portfolio()
    {
        return $this->belongsTo(Portfolio::class);
    }
}