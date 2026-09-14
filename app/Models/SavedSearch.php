<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SavedSearch extends Model
{
    protected $fillable = [
        'user_id', 'company_id', 'name', 'criteria',
        'notify_on_match', 'last_run_at',
    ];

    protected $casts = [
        'criteria' => 'array',
        'notify_on_match' => 'boolean',
        'last_run_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}