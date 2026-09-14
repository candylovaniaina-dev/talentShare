<?php

namespace App\Http\Requests\ResourceRequest;

use Illuminate\Foundation\Http\FormRequest;

class ResourceRequestRequest extends FormRequest
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
            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after_or_equal:start_at'],
            'workload_percent' => ['required', 'integer', 'min:0', 'max:100'],
            'remote' => ['boolean'],
            'country' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'status' => ['required', 'in:draft,published,closed,expired'],
            'expires_at' => ['nullable', 'date'],
            'skills' => ['nullable', 'array'],
            'skills.*.skill_id' => ['required_with:skills', 'exists:skills,id'],
            'skills.*.min_level' => ['required_with:skills', 'in:beginner,intermediate,advanced,expert'],
        ];
    }
}