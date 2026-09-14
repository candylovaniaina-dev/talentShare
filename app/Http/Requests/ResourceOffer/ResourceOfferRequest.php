<?php

namespace App\Http\Requests\ResourceOffer;

use Illuminate\Foundation\Http\FormRequest;

class ResourceOfferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_id' => ['required', 'exists:companies,id'],
            'professional_profile_id' => ['required', 'exists:professional_profiles,id'],
            'title' => ['required', 'string', 'max:180'],
            'description' => ['nullable', 'string'],
            'mission_type' => ['required', 'in:mission,staffing,freelance,other'],
            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after_or_equal:start_at'],
            'workload_percent' => ['required', 'integer', 'min:0', 'max:100'],
            'remote' => ['boolean'],
            'country' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'visibility' => ['required', 'in:public,network,private'],
            'status' => ['required', 'in:draft,published,closed'],
        ];
    }
}