<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EducationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'institution'     => ['required', 'string', 'max:255'],
            'degree'          => ['required', 'string', 'max:255'],
            'field_of_study'  => ['nullable', 'string', 'max:255'],
            'study_level'     => ['nullable', 'string', 'max:40'],   // ✅ assoupli
            'start_date'      => ['nullable', 'date'],               // ✅ assoupli
            'end_date'        => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_current'      => ['boolean'],
            'is_young_talent' => ['boolean'],
        ];
    }
}