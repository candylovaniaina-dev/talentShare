<?php

namespace App\Http\Requests\University;

use Illuminate\Foundation\Http\FormRequest;

class OnboardingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'          => ['required', 'string', 'min:2', 'max:150'],
            'type'          => ['required', 'in:public,prive,institut,ecole,centre_formation'],
            'city'          => ['required', 'string', 'max:100'],
            'region'        => ['required', 'string', 'max:100'],
            'address'       => ['nullable', 'string', 'max:255'],
            'phone'         => ['nullable', 'regex:/^\+261 (3[23478]|20) \d{2} \d{3} \d{2}$/'],
            'contact_email' => ['nullable', 'email:rfc', 'max:150'],
            'website'       => ['nullable', 'url:http,https', 'max:255'],
            'description'   => ['nullable', 'string', 'max:3000'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.regex'   => 'Format attendu : +261 34 56 789 00.',
            'website.url'   => 'Entrez un lien valide, ex. https://universite.mg.',
            'contact_email.email' => 'Adresse e-mail invalide.',
        ];
    }
}