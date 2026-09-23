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
        $isYoungTalent = in_array($this->input('profile_type'), ['student'])
            || $this->boolean('is_young_talent');

        return [
            'profile_type' => ['required', 'in:employee,student,freelancer'],
            'headline' => ['required', 'string', 'max:180'],
            'bio' => ['nullable', 'string'],
            'visibility' => ['required', 'in:public,network,private'],
            'country' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'portfolio_url' => ['nullable', 'url', 'max:255'],
            'linkedin_url' => ['nullable', 'url', 'max:255'],
            'github_url' => ['nullable', 'url', 'max:255'],
            'behance_url' => ['nullable', 'url', 'max:255'],

            // Champs Young Talent
            'is_young_talent' => ['nullable', 'boolean'],
            'looking_for_opportunity' => ['nullable', 'boolean'],
            'university' => [$isYoungTalent ? 'required' : 'nullable', 'string', 'max:255'],
            'field_of_study' => [$isYoungTalent ? 'required' : 'nullable', 'string', 'max:255'],
            'study_level' => [$isYoungTalent ? 'required' : 'nullable', 'in:L1,L2,L3,M1,M2,Doctorat,BTS,DUT,Licence,Master,Autre'],
        ];
    }

    public function messages(): array
    {
        return [
            'university.required' => 'L\'université est obligatoire pour un Young Talent.',
            'field_of_study.required' => 'La filière est obligatoire pour un Young Talent.',
            'study_level.required' => 'Le niveau d\'étude est obligatoire pour un Young Talent.',
        ];
    }
}