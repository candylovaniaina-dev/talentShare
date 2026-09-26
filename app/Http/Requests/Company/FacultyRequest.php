<?php

namespace App\Http\Requests\Company;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FacultyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $facultyId = $this->route('faculty')?->id;

        return [
            'name'        => ['required', 'string', 'max:180'],
            'slug'        => ['nullable', 'string', 'max:220', Rule::unique('faculties', 'slug')->ignore($facultyId)],
            'description' => ['nullable', 'string'],
        ];
    }
}