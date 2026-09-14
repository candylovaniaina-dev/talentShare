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
        return [
            'profile_type' => ['required', 'in:employee,student'],
            'headline' => ['required', 'string', 'max:180'],
            'bio' => ['nullable', 'string'],
            'visibility' => ['required', 'in:public,network,private'],
            'country' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'portfolio_url' => ['nullable', 'url', 'max:255'],
            'linkedin_url' => ['nullable', 'url', 'max:255'],
            'github_url' => ['nullable', 'url', 'max:255'],
            'behance_url' => ['nullable', 'url', 'max:255'],
        ];
    }
}