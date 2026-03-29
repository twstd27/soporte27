<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTicketRequest;
use App\Http\Requests\UpdateTicketRequest;
use App\Http\Resources\SupportTicketDetailResource;
use App\Http\Resources\SupportTicketResource;
use App\Models\SupportTicket;
use App\Models\TicketChangeLog;
use App\Models\TicketStatusLog;
use App\Models\User;
use App\Notifications\TicketAssigned;
use App\Notifications\TicketDelivered;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportTicketController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SupportTicket::with(['customer', 'technician', 'category', 'brand', 'supportType'])
            ->withCount(['photos', 'spareParts']);

        if ($request->boolean('with_trashed') && $request->user()->isAdmin()) {
            $query->withTrashed();
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('technician_id')) {
            $query->where('technician_id', $request->technician_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('reception_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('reception_date', '<=', $request->date_to);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('ticket_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $perPage = min((int) $request->input('per_page', 15), 200);
        $tickets = $query->latest()->paginate($perPage);

        return response()->json([
            'data' => SupportTicketResource::collection($tickets->items()),
            'message' => 'Tickets retrieved successfully.',
            'meta' => [
                'current_page' => $tickets->currentPage(),
                'last_page' => $tickets->lastPage(),
                'per_page' => $tickets->perPage(),
                'total' => $tickets->total(),
            ],
        ]);
    }

    public function store(StoreTicketRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()->id;
        $data['status'] = $data['status'] ?? 'received';

        $ticket = SupportTicket::create($data);

        TicketStatusLog::create([
            'ticket_id' => $ticket->id,
            'changed_by' => $request->user()->id,
            'old_status' => null,
            'new_status' => $ticket->status,
            'notes' => 'Ticket created.',
        ]);

        $ticket->load(['customer', 'technician', 'category', 'brand', 'supportType', 'photos', 'spareParts.supplier', 'statusLogs.changedBy']);

        if ($ticket->technician_id) {
            $ticket->technician->notify(new TicketAssigned($ticket));
        }

        ActivityLogger::log('ticket_created', "Ticket {$ticket->ticket_number} creado", 'ticket', $ticket->id, $ticket->ticket_number);

        return response()->json([
            'data' => new SupportTicketDetailResource($ticket),
            'message' => 'Ticket created successfully.',
        ], 201);
    }

    public function show(SupportTicket $ticket): JsonResponse
    {
        $ticket->load(['customer', 'technician', 'category', 'brand', 'supportType', 'photos', 'spareParts.supplier', 'statusLogs.changedBy', 'creator', 'changeLogs.user']);

        return response()->json([
            'data' => new SupportTicketDetailResource($ticket),
            'message' => 'Ticket retrieved successfully.',
        ]);
    }

    public function update(UpdateTicketRequest $request, SupportTicket $ticket): JsonResponse
    {
        $data = $request->validated();
        $oldStatus = $ticket->status;

        $trackedFields = ['diagnosis', 'work_performed', 'labor_cost', 'technician_id'];
        $oldValues = [];
        $oldTechnicianId = $ticket->technician_id;
        foreach ($trackedFields as $field) {
            $oldValues[$field] = $ticket->$field;
        }

        $ticket->fill($data);

        if (isset($data['labor_cost'])) {
            $ticket->save();
            $ticket->recalculateTotalCost();
        } else {
            $ticket->save();
        }

        foreach ($trackedFields as $field) {
            if (isset($data[$field]) && (string)$oldValues[$field] !== (string)$data[$field]) {
                TicketChangeLog::create([
                    'ticket_id' => $ticket->id,
                    'user_id'   => $request->user()->id,
                    'field'     => $field,
                    'old_value' => (string)($oldValues[$field] ?? ''),
                    'new_value' => (string)($data[$field] ?? ''),
                ]);
            }
        }

        if (isset($data['status']) && $data['status'] !== $oldStatus) {
            TicketStatusLog::create([
                'ticket_id' => $ticket->id,
                'changed_by' => $request->user()->id,
                'old_status' => $oldStatus,
                'new_status' => $data['status'],
                'notes' => $request->input('status_notes'),
            ]);
        }

        $ticket->load(['customer', 'technician', 'category', 'brand', 'supportType', 'photos', 'spareParts.supplier', 'statusLogs.changedBy', 'creator', 'changeLogs.user']);

        if (
            isset($data['technician_id']) &&
            $ticket->technician_id &&
            $ticket->technician_id !== $oldTechnicianId
        ) {
            $ticket->technician->notify(new TicketAssigned($ticket));
        }

        return response()->json([
            'data' => new SupportTicketDetailResource($ticket),
            'message' => 'Ticket updated successfully.',
        ]);
    }

    public function duplicate(Request $request, SupportTicket $ticket): JsonResponse
    {
        $newTicket = $ticket->replicate([
            'ticket_number', 'status', 'diagnosis', 'work_performed',
            'actual_return_date', 'labor_cost', 'total_cost', 'reception_date',
        ]);
        $newTicket->status = 'received';
        $newTicket->reception_date = now()->toDateString();
        $newTicket->created_by = $request->user()->id;
        $newTicket->labor_cost = 0;
        $newTicket->total_cost = 0;
        $newTicket->diagnosis = null;
        $newTicket->work_performed = null;
        $newTicket->actual_return_date = null;
        $newTicket->save();

        TicketStatusLog::create([
            'ticket_id'  => $newTicket->id,
            'changed_by' => $request->user()->id,
            'old_status' => null,
            'new_status' => 'received',
            'notes'      => 'Duplicado desde ' . $ticket->ticket_number,
        ]);

        $newTicket->load(['customer', 'technician', 'category', 'brand', 'supportType', 'photos', 'spareParts.supplier', 'statusLogs.changedBy', 'creator', 'changeLogs.user']);

        return response()->json([
            'data'    => new SupportTicketDetailResource($newTicket),
            'message' => 'Ticket duplicado correctamente.',
        ], 201);
    }

    public function destroy(SupportTicket $ticket): JsonResponse
    {
        ActivityLogger::log('ticket_deleted', "Ticket {$ticket->ticket_number} eliminado", 'ticket', $ticket->id, $ticket->ticket_number);
        $ticket->delete();
        return response()->json(['data' => null, 'message' => 'Ticket eliminado correctamente.']);
    }

    public function restore(string $id): JsonResponse
    {
        $ticket = SupportTicket::withTrashed()->findOrFail($id);
        $ticket->restore();
        ActivityLogger::log('ticket_restored', "Ticket {$ticket->ticket_number} restaurado", 'ticket', $ticket->id, $ticket->ticket_number);
        return response()->json(['data' => null, 'message' => 'Ticket restaurado correctamente.']);
    }

    public function updateStatus(Request $request, SupportTicket $ticket): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'string', 'in:received,diagnosing,in_repair,waiting_parts,ready,delivered'],
            'notes' => ['nullable', 'string'],
        ]);

        $allowedTransitions = [
            'received' => ['diagnosing'],
            'diagnosing' => ['in_repair', 'waiting_parts', 'ready'],
            'in_repair' => ['waiting_parts', 'ready'],
            'waiting_parts' => ['in_repair', 'ready'],
            'ready' => ['delivered'],
            'delivered' => [],
        ];

        $newStatus = $request->status;
        $currentStatus = $ticket->status;

        if (!in_array($newStatus, $allowedTransitions[$currentStatus] ?? [])) {
            return response()->json([
                'message' => "Invalid status transition from '{$currentStatus}' to '{$newStatus}'.",
                'allowed' => $allowedTransitions[$currentStatus] ?? [],
            ], 422);
        }

        $oldStatus = $ticket->status;
        $ticket->status = $newStatus;

        if ($newStatus === 'delivered') {
            $ticket->actual_return_date = now()->toDateString();
        }

        $ticket->save();

        TicketStatusLog::create([
            'ticket_id' => $ticket->id,
            'changed_by' => $request->user()->id,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'notes' => $request->notes,
        ]);

        $ticket->load(['customer', 'technician', 'category', 'brand', 'supportType', 'photos', 'spareParts.supplier', 'statusLogs.changedBy', 'creator']);

        if ($newStatus === 'delivered') {
            $admins = User::where('role', 'admin')->where('is_active', true)->get();
            foreach ($admins as $admin) {
                $admin->notify(new TicketDelivered($ticket));
            }
        }

        ActivityLogger::log('ticket_status_changed', "Ticket {$ticket->ticket_number}: {$oldStatus} → {$newStatus}", 'ticket', $ticket->id, $ticket->ticket_number);

        return response()->json([
            'data' => new SupportTicketDetailResource($ticket),
            'message' => 'Ticket status updated successfully.',
        ]);
    }
}
