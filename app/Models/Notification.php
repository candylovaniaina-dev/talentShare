<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'user_id', 'type', 'title', 'body',
        'subject_type', 'subject_id', 'read_at',
    ];

    protected $casts = ['read_at' => 'datetime'];

    // ✅ Accessor : construit l'URL de redirection selon le type
    public function getActionUrlAttribute()
    {
        // Si subject_id pointe vers une Mission
        $missionTypes = [
            'mission_pending_approval',
            'mission_created_pending',
            'mission_accepted',
            'mission_declined',
        ];

        if (in_array($this->type, $missionTypes) && $this->subject_id) {
            return "/missions/{$this->subject_id}";
        }

        // Si subject_id pointe vers une ResourceOffer
        $offerTypes = [
            'offer_viewed',
            'offer_contacted',
            'resource_offer_published',
        ];

        if (in_array($this->type, $offerTypes) && $this->subject_id) {
            return "/resource-offers/{$this->subject_id}";
        }

        // Autres types
        return match ($this->type) {
            'new_message' => '/messages',
            default       => null,
        };
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function subject()
    {
        return $this->morphTo();
    }
}