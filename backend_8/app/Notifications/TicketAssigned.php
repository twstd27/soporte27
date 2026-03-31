<?php

namespace App\Notifications;

use App\Models\SupportTicket;
use Illuminate\Notifications\Notification;

class TicketAssigned extends Notification
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
            'type'          => 'ticket_assigned',
            'ticket_id'     => $this->ticket->id,
            'ticket_number' => $this->ticket->ticket_number,
            'model'         => $this->ticket->model,
            'customer_name' => optional($this->ticket->customer)->name,
            'message'       => "Se te asignó el ticket {$this->ticket->ticket_number}",
        ];
    }
}
