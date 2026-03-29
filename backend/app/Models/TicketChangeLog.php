<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketChangeLog extends Model
{
    protected $fillable = ['ticket_id', 'user_id', 'field', 'old_value', 'new_value'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function ticket()
    {
        return $this->belongsTo(SupportTicket::class, 'ticket_id');
    }
}
