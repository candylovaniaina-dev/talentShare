<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Document extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'documentable_type', 'documentable_id',
        'type', 'document_type', 'status',
        'file_path', 'original_name', 'mime_type', 'size',
        'current_version', 'expires_at', 'signed_at', 'signed_by',
        'notes', 'uploaded_by',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'signed_at' => 'datetime',
        'size' => 'integer',
        'current_version' => 'integer',
    ];

    protected $appends = ['file_url', 'is_expired'];

    // ============ RELATIONS ============
    public function documentable()
    {
        return $this->morphTo();
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function signedBy()
    {
        return $this->belongsTo(User::class, 'signed_by');
    }

    public function versions()
    {
        return $this->hasMany(DocumentVersion::class)->orderByDesc('version_number');
    }

    public function currentVersionFile()
    {
        return $this->hasOne(DocumentVersion::class)->latestOfMany('version_number');
    }

    public function history()
    {
        return $this->hasMany(DocumentHistory::class)->orderByDesc('created_at');
    }

    // ============ SCOPES ============
    public function scopeType($query, string $type)
    {
        return $query->where('document_type', $type);
    }

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeExpired($query)
    {
        return $query->whereNotNull('expires_at')->where('expires_at', '<', now());
    }

    // ============ ACCESSORS ============
    public function getFileUrlAttribute(): ?string
    {
        if (!$this->file_path) return null;
        return url('storage/' . $this->file_path);
    }

    public function getIsExpiredAttribute(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    // ============ HELPERS ============
    public function logHistory(string $action, ?string $oldValue = null, ?string $newValue = null, ?string $notes = null, ?int $userId = null): void
    {
        $this->history()->create([
            'user_id' => $userId ?? auth()->id(),
            'action' => $action,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'notes' => $notes,
        ]);
    }

    public function addVersion(string $filePath, string $originalName, ?string $mimeType = null, int $size = 0, ?int $userId = null): DocumentVersion
    {
        $newVersion = $this->current_version + 1;

        $version = $this->versions()->create([
            'version_number' => $newVersion,
            'file_path' => $filePath,
            'original_name' => $originalName,
            'mime_type' => $mimeType,
            'size' => $size,
            'uploaded_by' => $userId ?? auth()->id(),
        ]);

        $this->update([
            'current_version' => $newVersion,
            'file_path' => $filePath,
            'original_name' => $originalName,
            'mime_type' => $mimeType,
            'size' => $size,
        ]);

        $this->logHistory('version_added', null, "v{$newVersion}", null, $userId);

        return $version;
    }
}