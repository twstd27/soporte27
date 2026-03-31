<?php

namespace App\Notifications;

use App\Models\SupportTicket;
use Illuminate\Notifications\Notification;

class TicketDelivered extends Notification
{
    private $ticket;

    public function __construct(SupportTicket $ticket)
    {
        $this->ticket = $ticket;
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'type'          => 'ticket_delivered',
            'ticket_id'     => $this->ticket->id,
            'ticket_number' => $this->ticket->ticket_number,
            'model'         => $this->ticket->model,
            'customer_name' => optional($this->ticket->customer)->name,
            'technician'    => optional($this->ticket->technician)->name,
            'message'       => "Ticket {$this->ticket->ticket_number} entregado al cliente",
        ];
    }
}
