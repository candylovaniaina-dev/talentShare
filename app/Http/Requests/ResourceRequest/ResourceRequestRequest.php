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
            'company_id'          => ['required', 'exists:companies,id'],
            'title'               => ['required', 'string', 'max:180'],
            'description'         => ['required', 'string'],
            'start_at'            => ['required', 'date'],
            'end_at'              => ['required', 'date', 'after_or_equal:start_at'],
            'workload_percent'    => ['required', 'integer', 'min:0', 'max:100'],
            'remote'              => ['boolean'],
            'country'             => ['nullable', 'string', 'max:100'],
            'city'                => ['nullable', 'string', 'max:100'],
            'status'              => ['required', 'in:draft,published,paused,closed,filled,expired'],
            'expires_at'          => ['nullable', 'date', 'after_or_equal:today'],

            // ✅ NOUVEAUX CHAMPS P0-9
            'budget_min'          => ['nullable', 'integer', 'min:0'],
            'budget_max'          => ['nullable', 'integer', 'min:0', 'gte:budget_min'],
            'positions_count'     => ['nullable', 'integer', 'min:1', 'max:50'],
            'urgency'             => ['nullable', 'in:normal,urgent'],
            'tags'                => ['nullable', 'array'],
            'tags.*'              => ['string', 'max:50'],

            'skills'              => ['nullable', 'array'],
            'skills.*.skill_id'   => ['required_with:skills', 'exists:skills,id'],
            'skills.*.min_level'  => ['required_with:skills', 'in:beginner,intermediate,advanced,expert'],
        ];
    }

    public function messages(): array
    {
        return [
            'budget_max.gte' => 'Le budget maximum doit être supérieur ou égal au minimum.',
            'expires_at.after_or_equal' => 'La date d\'expiration doit être dans le futur.',
        ];
    }
}