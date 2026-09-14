<?php

namespace App\Http\Requests\Application;

use Illuminate\Foundation\Http\FormRequest;

class ApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'job_offer_id' => ['required', 'exists:job_offers,id'],
            'portfolio_id' => ['nullable', 'exists:portfolios,id'],
            'cover_letter' => ['nullable', 'string'],
        ];
    }
}