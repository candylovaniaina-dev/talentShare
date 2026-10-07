<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Message extends Model
{
    protected $fillable = [
        'conversation_id',
        'sender_id',
        'body',
        'attachment_path',
        'attachment_name',
        'attachment_type',
    ];

    protected $appends = ['attachment_url'];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * ✅ URL publique de la pièce jointe
     */
    public function getAttachmentUrlAttribute(): ?string
    {
        if (!$this->attachment_path) return null;
        return url('storage/' . $this->attachment_path);
    }
}