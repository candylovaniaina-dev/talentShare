<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Certification extends Model
{
    protected $fillable = ['professional_profile_id', 'name', 'issuing_organization', 'issue_date', 'credential_url'];
    protected $casts = ['issue_date' => 'date'];

    public function profile() { return $this->belongsTo(ProfessionalProfile::class, 'professional_profile_id'); }
}