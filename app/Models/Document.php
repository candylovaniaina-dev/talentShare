<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $fillable = [
        'documentable_type', 'documentable_id', 'uploaded_by',
        'type', 'file_path', 'original_name', 'mime_type', 'size',
        'version', 'status',
    ];

    protected $casts = [
        'size' => 'integer',
    ];

    public function documentable()
    {
        return $this->morphTo();
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getFileUrlAttribute(): ?string
    {
        return $this->file_path ? asset('storage/' . $this->file_path) : null;
    }

    public function getFormattedSizeAttribute(): string
    {
        if (!$this->size) return '—';
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        $size = $this->size;
        while ($size >= 1024 && $i < count($units) - 1) {
            $size /= 1024;
            $i++;
        }
        return round($size, 1) . ' ' . $units[$i];
    }
}