<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class ProfessionalProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // ✅ Détecter si c'est un update ou un create
        $isUpdate = $this->isMethod('PATCH') || $this->isMethod('PUT');
        $required = $isUpdate ? 'sometimes' : 'required';

        // Détecter Young Talent
        $isYoungTalent = in_array($this->input('profile_type'), ['student'])
            || $this->boolean('is_young_talent');

        return [
            // Identité
            'profile_type' => [$required, 'in:employee,student,freelancer'],
            'headline'     => [$required, 'string', 'max:180'],
            'bio'          => ['nullable', 'string', 'max:2000'],

            // Visibilité
            'visibility' => [$required, 'in:public,network,private'],

            // Localisation
            'country' => ['nullable', 'string', 'max:100'],
            'city'    => ['nullable', 'string', 'max:100'],

            // Liens externes (max 500 pour accepter les URLs longues)
            'portfolio_url' => ['nullable', 'string', 'max:500'],
            'linkedin_url'  => ['nullable', 'string', 'max:500'],
            'github_url'    => ['nullable', 'string', 'max:500'],
            'behance_url'   => ['nullable', 'string', 'max:500'],

            // Champs Young Talent
            'is_young_talent'         => ['nullable', 'boolean'],
            'looking_for_opportunity' => ['nullable', 'boolean'],
            'university'              => ['nullable', 'string', 'max:255'],
            'field_of_study'          => ['nullable', 'string', 'max:255'],
            'study_level'             => ['nullable', 'in:L1,L2,L3,M1,M2,Doctorat,BTS,DUT,Licence,Master,Autre'],
        ];
    }

    public function messages(): array
    {
        return [
            'profile_type.required' => 'Le type de profil est obligatoire.',
            'headline.required'     => 'Le titre professionnel est obligatoire.',
            'visibility.required'   => 'La visibilité est obligatoire.',
            'portfolio_url.max'     => 'Le lien Portfolio est trop long (max 500 caractères).',
            'linkedin_url.max'      => 'Le lien LinkedIn est trop long (max 500 caractères).',
            'github_url.max'        => 'Le lien GitHub est trop long (max 500 caractères).',
            'behance_url.max'       => 'Le lien Behance est trop long (max 500 caractères).',
        ];
    }
}