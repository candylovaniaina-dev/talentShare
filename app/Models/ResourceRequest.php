<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

class ResourceRequest extends Model
{
    protected $fillable = [
        'company_id', 'created_by', 'author_type',
        'title', 'description',
        'start_at', 'end_at', 'workload_percent', 'remote',
        'country', 'city', 'status', 'expires_at',
        'budget_min', 'budget_max', 'positions_count', 'urgency', 'tags',
        'views_count', 'proposals_count', 'shares_count', 'closed_reason', 'closed_at', 'contract_type', 'mission_type',
    ];

    protected $casts = [
        'start_at' => 'date',
        'end_at' => 'date',
        'expires_at' => 'date',
        'closed_at' => 'datetime',
        'remote' => 'boolean',
        'tags' => 'array',
    ];

    // ✅ TRÈS IMPORTANT : On ajoute remaining_positions
    protected $appends = ['is_talent_request', 'remaining_positions'];

    public function company() { return $this->belongsTo(Company::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function author() { return $this->belongsTo(User::class, 'created_by'); }

    public function skills()
    {
        return $this->belongsToMany(Skill::class, 'resource_request_skill')
                     ->withPivot('min_level')
                     ->withTimestamps();
    }

    public function proposals() { return $this->hasMany(Proposal::class); }
    public function likes() { return $this->hasMany(ResourceRequestLike::class); }
    public function comments() { return $this->hasMany(ResourceRequestComment::class); }

    public function scopePublished(Builder $q): Builder
    {
        return $q->where('status', 'published')
                 ->where(fn ($sq) => $sq->whereNull('expires_at')->orWhere('expires_at', '>=', now()));
    }

    public function scopeNotExpired(Builder $q): Builder
    {
        return $q->where(fn ($sq) => $sq->whereNull('expires_at')->orWhere('expires_at', '>=', now()));
    }

    public function scopeMyCompany(Builder $q, $companyIds): Builder
    {
        return $q->whereIn('company_id', $companyIds);
    }

    public function scopeMyPublications(Builder $q, int $userId, array $companyIds = []): Builder
    {
        return $q->where(function ($sq) use ($userId, $companyIds) {
            $sq->where('created_by', $userId);
            if (!empty($companyIds)) $sq->orWhereIn('company_id', $companyIds);
        });
    }

    public function scopeSearch(Builder $q, string $s): Builder
    {
        return $q->where(function ($sq) use ($s) {
            $sq->where('title', 'ilike', "%{$s}%")->orWhere('description', 'ilike', "%{$s}%");
        });
    }

    public function getDisplayStatusAttribute(): string
    {
        if ($this->status === 'published' && $this->expires_at && $this->expires_at < now()->startOfDay()) {
            return 'expired';
        }
        return $this->status;
    }

    public function getDaysUntilExpiryAttribute(): ?int
    {
        if (!$this->expires_at) return null;
        return max(0, (int) Carbon::now()->startOfDay()->diffInDays($this->expires_at, false));
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->display_status) {
            'draft' => 'Brouillon',
            'published' => 'Publiée',
            'paused' => 'En pause',
            'closed' => 'Fermée',
            'filled' => 'Pourvue',
            'expired' => 'Expirée',
            default => $this->status,
        };
    }

    public function getIsOpenAttribute(): bool
    {
        return $this->display_status === 'published'
            && $this->proposals()->whereIn('status', ['sent', 'viewed', 'accepted'])->count() < $this->positions_count;
    }

    public function getIsTalentRequestAttribute(): bool
    {
        return $this->author_type === 'talent';
    }

    /**
     * ✅ Calcul du nombre de postes restants
     */
    public function getRemainingPositionsAttribute()
    {
        $filled = \App\Models\Mission::whereHas('proposal', function ($q) {
            $q->where('resource_request_id', $this->id);
        })->whereIn('status', ['pending_employee', 'planned', 'active', 'trial'])->count();

        return max(0, $this->positions_count - $filled);
    }
}