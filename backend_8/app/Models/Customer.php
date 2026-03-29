<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'company',
        'phone',
        'email',
        'document_number',
    ];

    public function tickets(): HasMany
    {
        return $this->hasMany(SupportTicket::class, 'customer_id');
    }
}
