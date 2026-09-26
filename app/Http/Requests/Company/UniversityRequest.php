<?php

namespace App\Http\Requests\Company;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UniversityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $universityId = $this->route('university')?->id;

        return [
            'name'        => ['required', 'string', 'max:180'],
            'slug'        => ['nullable', 'string', 'max:220', Rule::unique('universities', 'slug')->ignore($universityId)],
            'description' => ['nullable', 'string'],
            'country'     => ['required', 'string', 'max:100'],
            'city'        => ['required', 'string', 'max:100'],
            'address'     => ['nullable', 'string', 'max:255'],
            'latitude'    => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'   => ['nullable', 'numeric', 'between:-180,180'],
            'website'     => ['nullable', 'url', 'max:255'],
            'logo_path'   => ['nullable', 'string', 'max:255'],
            'is_verified' => ['boolean'],
        ];
    }
}