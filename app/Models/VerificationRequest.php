<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class VerificationRequest extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'verifiable_type',
        'verifiable_id',
        'requested_by',
        'reviewed_by',
        'document_path',
        'status',
        'review_note',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    // Relation polymorphique
    public function verifiable()
    {
        return $this->morphTo();
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}