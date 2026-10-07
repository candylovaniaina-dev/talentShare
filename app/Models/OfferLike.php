<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OfferLike extends Model
{
    protected $fillable = ['job_offer_id', 'user_id'];

    public function jobOffer() { return $this->belongsTo(JobOffer::class); }
    public function user() { return $this->belongsTo(User::class); }
}