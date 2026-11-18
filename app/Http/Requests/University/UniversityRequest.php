<?php

namespace App\Http\Requests\University;

use Illuminate\Foundation\Http\FormRequest;

class UniversityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'          => ['required', 'string', 'max:180'],
            'type'          => ['required', 'string', 'in:public,prive,institut,ecole,centre_formation'],
            'description'   => ['nullable', 'string'],
            'sector'        => ['nullable', 'string', 'max:255'],
            'size'          => ['nullable', 'string', 'max:50'],
            'country'       => ['nullable', 'string', 'max:100'],
            'city'          => ['nullable', 'string', 'max:100'],
            'region'        => ['nullable', 'string', 'max:100'],
            'address'       => ['nullable', 'string', 'max:255'],
            'latitude'      => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'     => ['nullable', 'numeric', 'between:-180,180'],
            'phone'         => ['nullable', 'string', 'max:40'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'website'       => ['nullable', 'url', 'max:255'],
            'founded_year'  => ['nullable', 'integer', 'between:1800,' . date('Y')],
            'accreditation' => ['nullable', 'string', 'max:255'],
            'campus' => ['nullable', 'string', 'max:255'],
        ];
    }
}