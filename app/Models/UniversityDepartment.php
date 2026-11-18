<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UniversityDepartment extends Model
{
    protected $guarded = [];

    public function programs(): HasMany { return $this->hasMany(UniversityProgram::class, 'department_id'); }
}
