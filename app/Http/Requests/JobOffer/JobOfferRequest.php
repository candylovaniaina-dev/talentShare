<?php

namespace App\Http\Requests\JobOffer;

use Illuminate\Foundation\Http\FormRequest;

class JobOfferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_id' => ['required', 'exists:companies,id'],
            'title' => ['required', 'string', 'max:180'],
            'description' => ['required', 'string'],
            'offer_type' => ['required', 'in:internship,apprenticeship,student_project,junior_mission,freelance,fixed_term,permanent,first_job'],
            'duration_text' => ['nullable', 'string', 'max:100'],
            'remote' => ['boolean'],
            'country' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'salary_min' => ['nullable', 'integer', 'min:0'],
            'salary_max' => ['nullable', 'integer', 'min:0', 'gte:salary_min'],
            'currency' => ['nullable', 'string', 'size:3'],
            'criteria' => ['nullable', 'string'],
            'application_deadline' => ['nullable', 'date'],
            'status' => ['required', 'in:draft,published,closed,expired'],
            'skills' => ['nullable', 'array'],
            'skills.*.skill_id' => ['required_with:skills', 'exists:skills,id'],
            'skills.*.min_level' => ['required_with:skills', 'in:beginner,intermediate,advanced,expert'],
        ];
    }
}