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
        'data' => 'array',
    ];

    /**
     * Accessor : construit l'URL de redirection selon le type
     */
    public function getActionUrlAttribute()
    {
        // ✅ P0-15 : Candidatures
        $applicationTypes = [
            'new_application',
            'application_viewed',
            'application_shortlisted',
            'application_interview',
            'application_accepted',
            'application_rejected',
        ];
        if (in_array($this->type, $applicationTypes)) {
            // Si on a un subject_id qui pointe vers une Application
            if ($this->subject_type === 'App\\Models\\Application' && $this->subject_id) {
                // Recruteur → liste des candidatures de l'offre
                // Candidat → détail de la candidature
                // On regarde dans data['url'] si fourni
                if (is_array($this->data) && isset($this->data['url'])) {
                    return $this->data['url'];
                }
                // Fallback
                if ($this->type === 'new_application') {
                    return "/my-offers";
                }
                return "/applications/{$this->subject_id}";
            }
        }

        // Missions
        $missionTypes = [
            'mission_pending_approval',
            'mission_created_pending',
            'mission_accepted',
            'mission_declined',
        ];
        if (in_array($this->type, $missionTypes) && $this->subject_id) {
            return "/missions/{$this->subject_id}";
        }

        // Offres de ressources
        $offerTypes = ['offer_viewed', 'offer_contacted', 'resource_offer_published'];
        if (in_array($this->type, $offerTypes) && $this->subject_id) {
            return "/resource-offers/{$this->subject_id}";
        }

        // Demandes de ressources
        $requestTypes = [
            'resource_request_published',
            'resource_request_matched',
            'resource_request_expiring',
            'resource_request_closed',
        ];
        if (in_array($this->type, $requestTypes) && $this->subject_id) {
            return "/resource-requests/{$this->subject_id}";
        }

        // Dispos expirantes
        if ($this->type === 'availability_expiring') {
            return "/profile#disponibilites";
        }

        // Recherches sauvegardées
        if ($this->type === 'saved_search_match') {
            return "/explore";
        }

        // Messages
        if ($this->type === 'new_message') {
            return "/messages";
        }

        // Propositions
        if ($this->type === 'proposal_accepted') {
            return "/missions";
        }
        if (in_array($this->type, [
            'proposal_received', 'proposal_declined', 'proposal_expired'
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