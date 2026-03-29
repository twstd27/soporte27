<?php

namespace App\Notifications;

use App\Models\SupportTicket;
use Illuminate\Notifications\Notification;

class TicketAssigned extends Notification
{
    public function __construct(private SupportTicket $ticket) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type'          => 'ticket_assigned',
            'ticket_id'     => $this->ticket->id,
            'ticket_number' => $this->ticket->ticket_number,
            'model'         => $this->ticket->model,
            'customer_name' => $this->ticket->customer?->name,
            'message'       => "Se te asignó el ticket {$this->ticket->ticket_number}",
        ];
    }
}
