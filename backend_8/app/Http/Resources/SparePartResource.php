<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SparePartResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'ticket_id' => $this->ticket_id,
            'name' => $this->name,
            'supplier' => $this->whenLoaded('supplier', fn() => ['id' => $this->supplier->id, 'name' => $this->supplier->name]),
            'supplier_id' => $this->supplier_id,
            'unit_price' => (float) $this->unit_price,
            'quantity' => $this->quantity,
            'subtotal' => (float) $this->subtotal,
            'purchase_date' => $this->purchase_date?->toDateString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
