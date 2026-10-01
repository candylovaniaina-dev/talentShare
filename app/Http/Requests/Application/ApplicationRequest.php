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
            'job_offer_id'  => ['required', 'exists:job_offers,id'],
            'portfolio_id'  => ['nullable', 'exists:portfolios,id'],
            'cover_letter'  => ['required', 'string', 'min:50', 'max:5000'],
            'cv_path'       => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'cover_letter.required' => 'La lettre de motivation est obligatoire.',
            'cover_letter.min'      => 'La lettre de motivation doit faire au moins 50 caractères.',
            'cover_letter.max'      => 'La lettre de motivation ne peut pas dépasser 5000 caractères.',
        ];
    }
}