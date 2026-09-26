<?php

namespace App\Http\Requests\Company;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProgramRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $programId = $this->route('program')?->id;

        return [
            'name'            => ['required', 'string', 'max:180'],
            'slug'            => ['nullable', 'string', 'max:220', Rule::unique('programs', 'slug')->ignore($programId)],
            'description'     => ['nullable', 'string'],
            'level'           => ['nullable', 'string', 'max:50'],
            'duration_months' => ['nullable', 'integer', 'min:1', 'max:120'],
            'language'        => ['nullable', 'string', 'max:10'],
            'tuition_fee'     => ['nullable', 'numeric', 'min:0'],
            'currency'        => ['nullable', 'string', 'size:3'],
            'is_active'       => ['boolean'],
        ];
    }
}