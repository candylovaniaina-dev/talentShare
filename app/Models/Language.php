<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Language extends Model
{
    protected $fillable = ['professional_profile_id', 'name', 'level'];

    public function profile() { return $this->belongsTo(ProfessionalProfile::class, 'professional_profile_id'); }
}