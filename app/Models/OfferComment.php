<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OfferComment extends Model
{
    protected $fillable = ['job_offer_id', 'user_id', 'content'];

    public function jobOffer() { return $this->belongsTo(JobOffer::class); }
    public function user() { return $this->belongsTo(User::class); }
}