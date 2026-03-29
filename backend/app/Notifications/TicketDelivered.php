<?php

namespace App\Notifications;

use App\Models\SupportTicket;
use Illuminate\Notifications\Notification;

class TicketDelivered extends Notification
{
    public function __construct(private SupportTicket $ticket) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type'          => 'ticket_delivered',
            'ticket_id'     => $this->ticket->id,
            'ticket_number' => $this->ticket->ticket_number,
            'model'         => $this->ticket->model,
            'customer_name' => $this->ticket->customer?->name,
            'technician'    => $this->ticket->technician?->name,
            'message'       => "Ticket {$this->ticket->ticket_number} entregado al cliente",
        ];
    }
}
