<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResourceOfferWaitlist extends Model
{
    public const ACTIVE = ['waiting', 'notified'];

    protected $fillable = [
        'resource_offer_id', 'company_id', 'user_id',
        'status', 'message', 'desired_start_at', 'notified_at',
    ];

    protected $casts = [
        'desired_start_at' => 'date',
        'notified_at'      => 'datetime',
    ];

    public function offer()   { return $this->belongsTo(ResourceOffer::class, 'resource_offer_id'); }
    public function company() { return $this->belongsTo(Company::class); }
    public function user()    { return $this->belongsTo(User::class); }
}