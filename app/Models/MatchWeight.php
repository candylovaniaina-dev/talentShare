<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MatchWeight extends Model
{
    protected $fillable = [
        'user_id',
        'weight_skills', 'weight_location', 'weight_availability',
        'weight_profile_type', 'weight_verified', 'weight_rating', 'weight_rate',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}