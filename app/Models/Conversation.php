<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    protected $fillable = ['subject_type', 'subject_id', 'title'];

    public function subject()
    {
        return $this->morphTo();
    }

        public function participants()
    {
        return $this->belongsToMany(User::class, 'conversation_participants')
                     ->withPivot('last_read_at', 'is_archived')
                     ->withTimestamps();
    }

    public function messages()
    {
        return $this->hasMany(Message::class)->orderBy('created_at');
    }
        /**
     * ✅ Compteur simple des non-lus (calculé via relation)
     */
    public function unreadMessagesFor(int $userId)
    {
        return $this->hasMany(Message::class)
            ->where('sender_id', '!=', $userId);
    }
}