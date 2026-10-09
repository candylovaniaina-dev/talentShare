<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResourceRequestComment extends Model
{
    protected $fillable = ['resource_request_id', 'user_id', 'content'];

    public function resourceRequest() { return $this->belongsTo(ResourceRequest::class); }
    public function user() { return $this->belongsTo(User::class); }
}