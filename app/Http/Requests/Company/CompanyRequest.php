<?php

namespace App\Http\Requests\Company;

use Illuminate\Foundation\Http\FormRequest;

class CompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Convertit les chaînes vides en null AVANT la validation
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'description' => $this->description ?: null,
            'industry'    => $this->industry ?: null,
            'size'        => $this->size ?: null,
            'country'     => $this->country ?: null,
            'city'        => $this->city ?: null,
            'address'     => $this->address ?: null,
            'latitude'    => $this->latitude !== '' && $this->latitude !== null ? $this->latitude : null,
            'longitude'   => $this->longitude !== '' && $this->longitude !== null ? $this->longitude : null,
            'website'     => $this->website ?: null,
            'phone'       => $this->phone ?: null,
        ]);
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:180'],
            'description' => ['nullable', 'string'],
            'industry'    => ['nullable', 'string', 'max:100'],
            'size'        => ['nullable', 'string', 'max:50'],
            'country'     => ['nullable', 'string', 'max:100'],
            'city'        => ['nullable', 'string', 'max:100'],
            'address'     => ['nullable', 'string', 'max:255'],
            'latitude'    => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'   => ['nullable', 'numeric', 'between:-180,180'],
            'website'     => ['nullable', 'url', 'max:255'],
            'phone'       => ['nullable', 'string', 'max:30'],
        ];
    }

    public function messages(): array
    {
        return [
            'latitude.between'  => 'La latitude doit être comprise entre -90 et 90.',
            'longitude.between' => 'La longitude doit être comprise entre -180 et 180.',
            'website.url'       => 'Le site web doit être une URL valide (ex: https://example.com).',
        ];
    }
}