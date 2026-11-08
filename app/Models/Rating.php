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

    // ✅ Récupérer la cible (celui qui est noté)
    // Si c'est un 'company' qui note, la cible est le talent de la mission.
    // Si c'est un 'talent' qui note, la cible est l'owner de l'entreprise de la mission.
    public function getTargetUserAttribute()
    {
        if ($this->rater_role === 'company') {
            return $this->mission?->profile?->user;
        }
        return $this->mission?->requestingCompany?->owner ?? $this->mission?->supplyingCompany?->owner;
    }
}