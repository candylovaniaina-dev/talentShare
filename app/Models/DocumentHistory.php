<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentHistory extends Model
{
    protected $table = 'document_history';

    protected $fillable = [
        'document_id', 'user_id', 'action',
        'old_value', 'new_value', 'notes',
    ];

    public function document()
    {
        return $this->belongsTo(Document::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getActionLabelAttribute(): string
    {
        return [
            'created' => 'Créé',
            'updated' => 'Modifié',
            'status_changed' => 'Statut changé',
            'version_added' => 'Nouvelle version',
            'downloaded' => 'Téléchargé',
            'signed' => 'Signé',
            'deleted' => 'Supprimé',
        ][$this->action] ?? $this->action;
    }
}