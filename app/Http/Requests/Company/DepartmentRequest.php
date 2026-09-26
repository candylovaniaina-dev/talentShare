<?php

namespace App\Http\Requests\Company;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $departmentId = $this->route('department')?->id;

        return [
            'name'        => ['required', 'string', 'max:180'],
            'slug'        => ['nullable', 'string', 'max:220', Rule::unique('departments', 'slug')->ignore($departmentId)],
            'description' => ['nullable', 'string'],
        ];
    }
}