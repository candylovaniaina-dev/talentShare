<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Experience extends Model
{
    protected $fillable = ['professional_profile_id', 'title', 'company', 'location', 'start_date', 'end_date', 'is_current', 'description'];
    protected $casts = ['start_date' => 'date', 'end_date' => 'date', 'is_current' => 'boolean'];

    public function profile() { return $this->belongsTo(ProfessionalProfile::class, 'professional_profile_id'); }
}