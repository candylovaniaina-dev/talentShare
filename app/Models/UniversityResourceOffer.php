<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UniversityResourceOffer extends Model
{
    protected $guarded = [];

    protected $casts = ['skills' => 'array', 'available_from' => 'date:Y-m-d', 'deadline' => 'date:Y-m-d'];

    public function university(): BelongsTo { return $this->belongsTo(University::class); }
    public function targetCompany(): BelongsTo { return $this->belongsTo(Company::class, 'target_company_id'); }
    public function students(): BelongsToMany
    {
        return $this->belongsToMany(UniversityStudent::class, 'university_resource_offer_students', 'offer_id', 'student_id');
    }
    public function interests(): HasMany { return $this->hasMany(UniversityResourceInterest::class, 'offer_id'); }
}
