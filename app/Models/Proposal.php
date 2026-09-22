<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Proposal extends Model
{
    protected $fillable = [
        'resource_request_id',
        'resource_offer_id',
        'professional_profile_id',
        'proposed_by_company_id',
        'to_company_id',
        'message',
        'description',
        'conditions',
        'start_at',
        'end_at',
        'workload_percent',
        'remote',
        'expires_at',
        'match_score',
        'status',
        'sent_at',
        'viewed_at',
        'responded_at',
        'cancelled_at',
    ];

    protected $casts = [
        'start_at'         => 'date',
        'end_at'           => 'date',
        'expires_at'       => 'date',
        'remote'           => 'boolean',
        'sent_at'          => 'datetime',
        'viewed_at'        => 'datetime',
        'responded_at'     => 'datetime',
        'cancelled_at'     => 'datetime',
    ];

    // ============================================
    // RELATIONS
    // ============================================
    public function resourceRequest()
    {
        return $this->belongsTo(ResourceRequest::class);
    }

    public function resourceOffer()
    {
        return $this->belongsTo(ResourceOffer::class);
    }

    public function profile()
    {
        return $this->belongsTo(ProfessionalProfile::class, 'professional_profile_id');
    }

    public function proposingCompany()
    {
        return $this->belongsTo(Company::class, 'proposed_by_company_id');
    }

    public function toCompany()
    {
        return $this->belongsTo(Company::class, 'to_company_id');
    }

    public function mission()
    {
        return $this->hasOne(Mission::class);
    }

    public function documents()
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    // ============================================
    // SCOPES
    // ============================================
    public function scopeForCompany($q, $companyId)
    {
        return $q->where('proposed_by_company_id', $companyId)
                 ->orWhere('to_company_id', $companyId);
    }

    public function scopeNotExpired($q)
    {
        return $q->where(fn ($sq) => $sq->whereNull('expires_at')->orWhere('expires_at', '>=', now()));
    }

    // ============================================
    // ACCESSORS
    // ============================================
    public function getDisplayStatusAttribute(): string
    {
        if ($this->status === 'sent' && $this->expires_at && $this->expires_at < now()->startOfDay()) {
            return 'expired';
        }
        return $this->status;
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->display_status) {
            'draft'    => 'Brouillon',
            'sent'     => 'Envoyée',
            'viewed'   => 'Consultée',
            'accepted' => 'Acceptée',
            'declined' => 'Refusée',
            'expired'  => 'Expirée',
            'cancelled' => 'Annulée',
            default    => $this->status,
        };
    }

    public function getDaysUntilExpiryAttribute(): ?int
    {
        if (!$this->expires_at) return null;
        return max(0, (int) Carbon::now()->startOfDay()->diffInDays($this->expires_at, false));
    }

    public function getIsPendingAttribute(): bool
    {
        return in_array($this->display_status, ['sent', 'viewed']);
    }
}