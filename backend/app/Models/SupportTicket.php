<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SupportTicket extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'ticket_number',
        'customer_id',
        'created_by',
        'technician_id',
        'category_id',
        'brand_id',
        'model',
        'serial_number',
        'description',
        'problem_description',
        'support_type_id',
        'reception_date',
        'estimated_return_date',
        'actual_return_date',
        'status',
        'diagnosis',
        'work_performed',
        'labor_cost',
        'advance_payment',
        'total_cost',
        'internal_notes',
        'warranty_days',
    ];

    protected $casts = [
        'reception_date' => 'date',
        'estimated_return_date' => 'date',
        'actual_return_date' => 'date',
        'labor_cost' => 'decimal:2',
        'advance_payment' => 'decimal:2',
        'total_cost' => 'decimal:2',
    ];

    protected $appends = ['photos_count', 'parts_count'];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (SupportTicket $ticket) {
            if (empty($ticket->ticket_number)) {
                $ticket->ticket_number = static::generateTicketNumber();
            }
        });
    }

    public static function generateTicketNumber(): string
    {
        $year = now()->year;
        $count = static::withTrashed()
            ->whereYear('created_at', $year)
            ->count();
        $sequence = str_pad($count + 1, 4, '0', STR_PAD_LEFT);
        return "ST-{$year}-{$sequence}";
    }

    public function recalculateTotalCost(): void
    {
        $partsCost = $this->spareParts()->sum('subtotal');
        $this->total_cost = $this->labor_cost + $partsCost;
        $this->saveQuietly();
    }

    public function getPhotosCountAttribute(): int
    {
        return $this->photos()->count();
    }

    public function getPartsCountAttribute(): int
    {
        return $this->spareParts()->count();
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function technician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(SupportCategory::class, 'category_id');
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class, 'brand_id');
    }

    public function supportType(): BelongsTo
    {
        return $this->belongsTo(SupportType::class, 'support_type_id');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(ToolPhoto::class, 'ticket_id');
    }

    public function spareParts(): HasMany
    {
        return $this->hasMany(SparePart::class, 'ticket_id');
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(TicketStatusLog::class, 'ticket_id');
    }

    public function changeLogs()
    {
        return $this->hasMany(TicketChangeLog::class, 'ticket_id')->latest();
    }
}
