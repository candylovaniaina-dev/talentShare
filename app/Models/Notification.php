<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'user_id', 'type', 'title', 'body',
        'subject_type', 'subject_id', 'read_at', 'data',
    ];

    protected $casts = [
        'read_at' => 'datetime',
        'data' => 'array',   // ✅ Laravel encode/décode automatiquement
    ];

    /**
     * ✅ Construit l'URL de redirection selon le type
     */
    public function getActionUrlAttribute()
    {
        // ✅ Priorité 1 : si data.url existe, on l'utilise
        if (is_array($this->data) && !empty($this->data['url'])) {
            return $this->data['url'];
        }

        // ✅ Priorité 2 : fallback selon le type
        
        // 1. Demandes de ressources (Publiées, Matchées, Expirées, Fermées)
        $requestTypes = [
            'resource_request_published',
            'resource_request_matched', // 🔥 C'est ton fameux cas ici
            'resource_request_expiring',
            'resource_request_closed',
        ];
        if (in_array($this->type, $requestTypes) && $this->subject_id) {
            return "/resource-requests/{$this->subject_id}";
        }

        // 2. Interactions sociales (J'aime / Commentaires)
        if (in_array($this->type, ['offer_liked', 'offer_commented', 'request_liked', 'request_commented'])) {
            if ($this->subject_type === 'App\Models\ResourceRequest' || (is_array($this->data) && ($this->data['type'] ?? '') === 'resource_request')) {
                return "/resource-requests/{$this->subject_id}";
            }
            return "/company#offer-{$this->subject_id}";
        }

        // 3. Candidatures
        $applicationTypes = [
            'new_application',
            'application_viewed',
            'application_shortlisted',
            'application_interview',
            'application_accepted',
            'application_rejected',
        ];
        if (in_array($this->type, $applicationTypes)) {
            if ($this->type === 'new_application') {
                return "/job-offers/{$this->subject_id}/applications";
            }
            return "/applications/{$this->subject_id}";
        }

        // 4. Missions
        $missionTypes = [
            'mission_pending_approval',
            'mission_created_pending',
            'mission_accepted',
            'mission_declined',
        ];
        if (in_array($this->type, $missionTypes) && $this->subject_id) {
            return "/missions/{$this->subject_id}";
        }

        // 5. Offres de ressources (profils proposés)
        $offerTypes = ['offer_viewed', 'offer_contacted', 'resource_offer_published'];
        if (in_array($this->type, $offerTypes) && $this->subject_id) {
            return "/resource-offers/{$this->subject_id}";
        }

        // 6. Propositions
        if ($this->type === 'proposal_received' && $this->subject_id) {
            return "/proposals/{$this->subject_id}";
        }
        if ($this->type === 'proposal_accepted') {
            return "/missions";
        }
        if (in_array($this->type, ['proposal_declined', 'proposal_expired'])) {
            return "/proposals";
        }

        // 7. Dispos expirantes
        if ($this->type === 'availability_expiring') {
            return "/profile#disponibilites";
        }

        // 8. Recherches sauvegardées
        if ($this->type === 'saved_search_match') {
            return "/explore";
        }

        // 9. Messages
        if ($this->type === 'new_message') {
            return "/messages";
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

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}