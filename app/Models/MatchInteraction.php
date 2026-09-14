<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MatchInteraction extends Model
{
    protected $fillable = [
        'user_id', 'target_type', 'target_id',
        'action', 'match_score_at_action', 'search_criteria',
    ];

    protected $casts = [
        'search_criteria' => 'array',
    ];

    public const ACTIONS = ['viewed', 'contacted', 'proposed', 'accepted', 'rejected'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function target()
    {
        return $this->morphTo();
    }
}