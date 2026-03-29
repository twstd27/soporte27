<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['sometimes', 'integer', 'exists:customers,id'],
            'technician_id' => ['nullable', 'integer', 'exists:users,id'],
            'category_id' => ['nullable', 'integer', 'exists:support_categories,id'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
            'model' => ['sometimes', 'string', 'max:255'],
            'serial_number' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'problem_description' => ['sometimes', 'string'],
            'support_type_id' => ['nullable', 'integer', 'exists:support_types,id'],
            'reception_date' => ['sometimes', 'date'],
            'estimated_return_date' => ['nullable', 'date'],
            'actual_return_date' => ['nullable', 'date'],
            'status' => ['sometimes', 'string', 'in:received,diagnosing,in_repair,waiting_parts,ready,delivered'],
            'diagnosis' => ['nullable', 'string'],
            'work_performed' => ['nullable', 'string'],
            'labor_cost' => ['nullable', 'numeric', 'min:0'],
            'advance_payment' => ['nullable', 'numeric', 'min:0'],
            'internal_notes' => ['nullable', 'string'],
            'warranty_days' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
