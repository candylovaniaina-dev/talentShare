<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class University extends Model
{
    protected $fillable = [
        'owner_user_id', 'name', 'slug', 'description',
        'country', 'city', 'address', 'latitude', 'longitude', 'website',
        'logo_path', 'is_verified',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }
}