<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    protected $fillable = [
        'job_offer_id',
        'professional_profile_id',
        'portfolio_id',
        'cover_letter',
        'cv_path',
        'status',
        'viewed_at',
        'shortlisted_at',
        'interview_at',
        'decided_at',
        'recruiter_notes',
        // ✅ NOUVEAU : champs entretien
        'interview_link',
        'interview_timezone',
        'interview_notes',
    ];

    protected function casts(): array
    {
        return [
            'viewed_at'      => 'datetime',
            'shortlisted_at' => 'datetime',
            'interview_at'   => 'datetime',
            'decided_at'     => 'datetime',
        ];
    }

    // ====== RELATIONS ======
    public function jobOffer()
    {
        return $this->belongsTo(JobOffer::class);
    }

    public function profile()
    {
        return $this->belongsTo(ProfessionalProfile::class, 'professional_profile_id');
    }

    public function portfolio()
    {
        return $this->belongsTo(Portfolio::class);
    }

    // ====== SCOPES ======
    public function scopeForProfile($query, $profileId)
    {
        return $query->where('professional_profile_id', $profileId);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    // ====== HELPERS ======
    public function getStatusLabelAttribute(): string
    {
        return [
            'sent'        => 'Envoyée',
            'viewed'      => 'Consultée',
            'shortlisted' => 'Présélectionnée',
            'interview'   => 'Entretien',
            'accepted'    => 'Acceptée',
            'rejected'    => 'Refusée',
        ][$this->status] ?? $this->status;
    }

    public function getStatusColorAttribute(): string
    {
        return [
            'sent'        => 'slate',
            'viewed'      => 'blue',
            'shortlisted' => 'violet',
            'interview'   => 'amber',
            'accepted'    => 'emerald',
            'rejected'    => 'rose',
        ][$this->status] ?? 'slate';
    }

    /**
     * Change le statut et met à jour le timestamp associé
     */
    public function transitionTo(string $newStatus): void
    {
        $timestamps = [
            'viewed'      => 'viewed_at',
            'shortlisted' => 'shortlisted_at',
            'interview'   => 'interview_at',
            'accepted'    => 'decided_at',
            'rejected'    => 'decided_at',
        ];

        $data = ['status' => $newStatus];

        if (isset($timestamps[$newStatus])) {
            $data[$timestamps[$newStatus]] = now();
        }

        $this->update($data);
    }

    /**
     * ✅ NOUVEAU : Formater la date/heure de l'entretien
     */
    public function getInterviewDateFormattedAttribute(): ?string
    {
        if (!$this->interview_at) return null;

        return $this->interview_at->locale('fr')->isoFormat('dddd D MMMM YYYY [à] HH:mm');
    }

    /**
     * ✅ NOUVEAU : Vérifie si l'entretien est à venir
     */
    public function getIsInterviewUpcomingAttribute(): bool
    {
        return $this->interview_at && $this->interview_at->isFuture();
    }
}