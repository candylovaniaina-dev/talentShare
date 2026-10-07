<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentVersion extends Model
{
    protected $fillable = [
        'document_id', 'version_number', 'file_path',
        'original_name', 'mime_type', 'size', 'notes', 'uploaded_by',
    ];

    protected $casts = [
        'version_number' => 'integer',
        'size' => 'integer',
    ];

    protected $appends = ['file_url'];

    public function document()
    {
        return $this->belongsTo(Document::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getFileUrlAttribute(): string
    {
        return url('storage/' . $this->file_path);
    }
}