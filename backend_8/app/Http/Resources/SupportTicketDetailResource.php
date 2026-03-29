<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupportTicketDetailResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'ticket_number' => $this->ticket_number,
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'customer_id' => $this->customer_id,
            'creator' => new UserResource($this->whenLoaded('creator')),
            'created_by' => $this->created_by,
            'technician' => new UserResource($this->whenLoaded('technician')),
            'technician_id' => $this->technician_id,
            'category' => new SupportCategoryResource($this->whenLoaded('category')),
            'category_id' => $this->category_id,
            'brand' => $this->whenLoaded('brand', fn() => ['id' => $this->brand->id, 'name' => $this->brand->name]),
            'brand_id' => $this->brand_id,
            'model' => $this->model,
            'serial_number' => $this->serial_number,
            'description' => $this->description,
            'problem_description' => $this->problem_description,
            'support_type' => $this->whenLoaded('supportType', fn() => ['id' => $this->supportType->id, 'name' => $this->supportType->name]),
            'support_type_id' => $this->support_type_id,
            'reception_date' => $this->reception_date?->toDateString(),
            'estimated_return_date' => $this->estimated_return_date?->toDateString(),
            'actual_return_date' => $this->actual_return_date?->toDateString(),
            'status' => $this->status,
            'diagnosis' => $this->diagnosis,
            'work_performed' => $this->work_performed,
            'labor_cost' => (float) $this->labor_cost,
            'advance_payment' => (float) $this->advance_payment,
            'total_cost' => (float) $this->total_cost,
            'internal_notes' => $this->internal_notes,
            'warranty_days' => $this->warranty_days,
            'photos_count' => $this->photos_count,
            'parts_count' => $this->parts_count,
            'photos' => ToolPhotoResource::collection($this->whenLoaded('photos')),
            'spare_parts' => SparePartResource::collection($this->whenLoaded('spareParts')),
            'status_logs' => TicketStatusLogResource::collection($this->whenLoaded('statusLogs')),
            'change_logs' => TicketChangeLogResource::collection($this->whenLoaded('changeLogs')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'deleted_at' => $this->deleted_at?->toISOString(),
        ];
    }
}
