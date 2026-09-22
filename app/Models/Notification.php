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
    // Missions
    $missionTypes = ['mission_pending_approval', 'mission_created_pending', 'mission_accepted', 'mission_declined'];
    if (in_array($this->type, $missionTypes) && $this->subject_id) {
        return "/missions/{$this->subject_id}";
    }

    // Offres
    $offerTypes = ['offer_viewed', 'offer_contacted', 'resource_offer_published'];
    if (in_array($this->type, $offerTypes) && $this->subject_id) {
        return "/resource-offers/{$this->subject_id}";
    }

    // ✅ P0-9 : Demandes de ressources
    $requestTypes = [
        'resource_request_published',
        'resource_request_matched',
        'resource_request_expiring',
        'resource_request_closed',
    ];
    if (in_array($this->type, $requestTypes) && $this->subject_id) {
        return "/resource-requests/{$this->subject_id}";
    }

    // ✅ P0-8 : Dispos expirantes
    if ($this->type === 'availability_expiring') {
        return "/profile#disponibilites";
    }

    // ✅ P0-8 : Recherches sauvegardées
    if ($this->type === 'saved_search_match') {
        return "/explore";
    }

    // Messages
    if ($this->type === 'new_message') {
        return "/messages";
    }

    // Propositions
    if ($this->type === 'proposal_accepted' && $this->subject_id) {
        return "/missions";
    }
if (in_array($this->type, [
    'proposal_received', 'proposal_accepted', 'proposal_declined', 'proposal_expired'
])) {
    return "/proposals";
}
    return null;
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