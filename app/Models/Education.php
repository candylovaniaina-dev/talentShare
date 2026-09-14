<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Education extends Model
{
    protected $table = 'educations'; // ← ajoute cette ligne, Eloquent ne pluralise pas "Education" tout seul

    protected $fillable = ['professional_profile_id', 'institution', 'degree', 'field_of_study', 'start_date', 'end_date', 'is_current'];
    protected $casts = ['start_date' => 'date', 'end_date' => 'date', 'is_current' => 'boolean'];

    public function profile() { return $this->belongsTo(ProfessionalProfile::class, 'professional_profile_id'); }
}