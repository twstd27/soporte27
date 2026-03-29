<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SparePart extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'name',
        'supplier_id',
        'unit_price',
        'quantity',
        'subtotal',
        'purchase_date',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'purchase_date' => 'date',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::saving(function (SparePart $part) {
            $part->subtotal = $part->unit_price * $part->quantity;
        });
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(SupportTicket::class, 'ticket_id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }
}
