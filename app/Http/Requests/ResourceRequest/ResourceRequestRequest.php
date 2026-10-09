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
            'company_id'          => ['nullable', 'exists:companies,id'],  // ✅ nullable
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

            'budget_min'          => ['nullable', 'integer', 'min:0'],
            'budget_max'          => ['nullable', 'integer', 'min:0', 'gte:budget_min'],
            'positions_count'     => ['nullable', 'integer', 'min:1', 'max:50'],
            'urgency'             => ['nullable', 'in:normal,urgent'],
            'tags'                => ['nullable', 'array'],
            'tags.*'              => ['string', 'max:50'],

            'skills'              => ['nullable', 'array'],
            'skills.*.skill_id'   => ['nullable', 'integer', 'exists:skills,id'],
            'skills.*.name'       => ['nullable', 'string', 'max:100'],
            'skills.*.min_level'  => ['nullable', 'in:beginner,intermediate,advanced,expert'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $user = $this->user();

            // ✅ Vérification entreprise OU talent
            if ($this->filled('company_id')) {
                if (!$user->companies()->where('id', $this->company_id)->exists()) {
                    $validator->errors()->add(
                        'company_id',
                        'Cette entreprise ne vous appartient pas.'
                    );
                }
            } elseif (!$user->isTalent()) {
                $validator->errors()->add(
                    'company_id',
                    'Vous devez sélectionner une entreprise.'
                );
            }

            // ✅ Validation skills
            $skills = $this->input('skills', []);
            foreach ($skills as $i => $skill) {
                $hasId = !empty($skill['skill_id']);
                $hasName = !empty($skill['name']);
                if (!$hasId && !$hasName) {
                    $validator->errors()->add(
                        "skills.{$i}",
                        "Chaque compétence doit avoir un skill_id ou un name."
                    );
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'budget_max.gte' => 'Le budget maximum doit être supérieur ou égal au minimum.',
            'expires_at.after_or_equal' => 'La date d\'expiration doit être dans le futur.',
        ];
    }
}