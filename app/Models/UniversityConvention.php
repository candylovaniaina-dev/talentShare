<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UniversityConvention extends Model
{
    protected $guarded = [];

    protected $casts = ['start_date' => 'date:Y-m-d', 'end_date' => 'date:Y-m-d'];

    public function student(): BelongsTo { return $this->belongsTo(UniversityStudent::class, 'student_id'); }
    public function company(): BelongsTo { return $this->belongsTo(Company::class); }
}
