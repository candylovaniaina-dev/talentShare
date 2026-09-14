<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rating extends Model
{
    protected $fillable = [
        'mission_id', 'rated_by', 'rater_role', 'skills_score', 'quality_score',
        'communication_score', 'punctuality_score', 'collaboration_score', 'comment',
    ];

    public function mission()
    {
        return $this->belongsTo(Mission::class);
    }

    public function rater()
    {
        return $this->belongsTo(User::class, 'rated_by');
    }
}