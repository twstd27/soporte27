<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketStatusLogResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'ticket_id' => $this->ticket_id,
            'changed_by' => new UserResource($this->whenLoaded('changedBy')),
            'old_status' => $this->old_status,
            'new_status' => $this->new_status,
            'notes' => $this->notes,
            'created_at' => optional($this->created_at)->toISOString(),
        ];
    }
}
