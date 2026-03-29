<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SupportTicketResource;
use App\Models\SparePart;
use App\Models\SupportTicket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function technicianSummary(Request $request): JsonResponse
    {
        $id = $request->user()->id;

        $active = SupportTicket::where('technician_id', $id)
            ->whereNotIn('status', ['delivered'])->count();

        $ready = SupportTicket::where('technician_id', $id)
            ->where('status', 'ready')->count();

        $deliveredThisMonth = SupportTicket::where('technician_id', $id)
            ->where('status', 'delivered')
            ->whereMonth('updated_at', now()->month)
            ->whereYear('updated_at', now()->year)
            ->count();

        $overdue = SupportTicket::where('technician_id', $id)
            ->whereNotIn('status', ['delivered'])
            ->whereNotNull('estimated_return_date')
            ->whereDate('estimated_return_date', '<', now()->toDateString())
            ->count();

        $avgDays = SupportTicket::where('technician_id', $id)
            ->where('status', 'delivered')
            ->whereNotNull('actual_return_date')
            ->whereNotNull('reception_date')
            ->selectRaw('AVG(DATEDIFF(actual_return_date, reception_date)) as avg_days')
            ->value('avg_days');

        $byStatus = SupportTicket::where('technician_id', $id)
            ->whereNotIn('status', ['delivered'])
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->map(fn($i) => ['status' => $i->status, 'count' => (int) $i->count]);

        return response()->json([
            'data' => [
                'active_tickets'      => $active,
                'ready_for_delivery'  => $ready,
                'delivered_this_month' => $deliveredThisMonth,
                'overdue_count'       => $overdue,
                'avg_resolution_days' => $avgDays ? round((float) $avgDays, 1) : null,
                'tickets_by_status'   => $byStatus,
            ],
        ]);
    }

    public function summary(): JsonResponse
    {
        $ticketsByStatus = SupportTicket::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $statuses = ['received', 'diagnosing', 'in_repair', 'waiting_parts', 'ready', 'delivered'];
        foreach ($statuses as $status) {
            if (!isset($ticketsByStatus[$status])) {
                $ticketsByStatus[$status] = 0;
            }
        }

        $activeTickets = SupportTicket::whereNotIn('status', ['delivered'])->count();
        $readyForDelivery = SupportTicket::where('status', 'ready')->count();

        $monthlyIncome = SupportTicket::where('status', 'delivered')
            ->whereMonth('updated_at', now()->month)
            ->whereYear('updated_at', now()->year)
            ->sum('total_cost');

        $deliveredThisMonth = SupportTicket::where('status', 'delivered')
            ->whereMonth('updated_at', now()->month)
            ->whereYear('updated_at', now()->year)
            ->count();

        $weeklyTrend = collect(range(6, 0))->map(function ($daysAgo) {
            $date = now()->subDays($daysAgo)->toDateString();
            $count = SupportTicket::whereDate('reception_date', $date)->count();
            return ['date' => now()->subDays($daysAgo)->format('d/m'), 'count' => $count];
        });

        $recentTickets = SupportTicket::with(['customer', 'brand', 'technician', 'supportType'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($t) => [
                'id'             => $t->id,
                'ticket_number'  => $t->ticket_number,
                'brand'          => $t->brand ? ['id' => $t->brand->id, 'name' => $t->brand->name] : null,
                'model'          => $t->model,
                'status'         => $t->status,
                'customer'       => $t->customer ? ['name' => $t->customer->name] : null,
                'technician'     => $t->technician ? ['name' => $t->technician->name] : null,
                'reception_date' => $t->reception_date?->toDateString(),
            ]);

        return response()->json([
            'data' => [
                'tickets_by_status'   => $ticketsByStatus,
                'active_tickets'      => $activeTickets,
                'ready_for_delivery'  => $readyForDelivery,
                'monthly_income'      => (float) $monthlyIncome,
                'income_this_month'   => (float) $monthlyIncome,
                'total_tickets'       => SupportTicket::count(),
                'delivered_this_month' => $deliveredThisMonth,
                'weekly_trend'        => $weeklyTrend,
                'recent_tickets'      => $recentTickets,
            ],
            'message' => 'Summary report retrieved successfully.',
        ]);
    }

    public function byStatus(): JsonResponse
    {
        $data = SupportTicket::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->map(fn ($item) => [
                'status' => $item->status,
                'count' => (int) $item->count,
            ]);

        return response()->json([
            'data' => $data,
            'message' => 'Tickets by status report retrieved successfully.',
        ]);
    }

    public function bySupportType(): JsonResponse
    {
        $data = SupportTicket::selectRaw('support_type_id, COUNT(*) as count')
            ->with('supportType')
            ->groupBy('support_type_id')
            ->get()
            ->map(fn ($item) => [
                'name' => $item->supportType?->name ?? 'Sin tipo',
                'count' => (int) $item->count,
            ]);

        return response()->json([
            'data' => $data,
            'message' => 'Tickets by support type report retrieved successfully.',
        ]);
    }

    public function costs(): JsonResponse
    {
        $months = collect(range(5, 0))->map(function ($monthsAgo) {
            $date = now()->subMonths($monthsAgo);
            return [
                'year' => $date->year,
                'month' => $date->month,
                'label' => $date->format('Y-m'),
            ];
        });

        $laborCosts = SupportTicket::selectRaw("DATE_FORMAT(reception_date, '%Y-%m') as period, SUM(labor_cost) as total_labor")
            ->whereDate('reception_date', '>=', now()->subMonths(5)->startOfMonth())
            ->groupByRaw("DATE_FORMAT(reception_date, '%Y-%m')")
            ->pluck('total_labor', 'period');

        $partsCosts = SparePart::selectRaw("DATE_FORMAT(purchase_date, '%Y-%m') as period, SUM(subtotal) as total_parts")
            ->whereDate('purchase_date', '>=', now()->subMonths(5)->startOfMonth())
            ->groupByRaw("DATE_FORMAT(purchase_date, '%Y-%m')")
            ->pluck('total_parts', 'period');

        $result = $months->map(function ($month) use ($laborCosts, $partsCosts) {
            $period = $month['label'];
            return [
                'period' => $period,
                'labor_cost' => (float) ($laborCosts[$period] ?? 0),
                'parts_cost' => (float) ($partsCosts[$period] ?? 0),
                'total' => (float) ($laborCosts[$period] ?? 0) + (float) ($partsCosts[$period] ?? 0),
            ];
        });

        return response()->json([
            'data' => $result,
            'message' => 'Costs report retrieved successfully.',
        ]);
    }

    public function financial(Request $request): JsonResponse
    {
        $dateFrom = $request->input('date_from', now()->startOfMonth()->toDateString());
        $dateTo   = $request->input('date_to', now()->toDateString());

        $deliveredQuery = SupportTicket::where('status', 'delivered')
            ->whereBetween('actual_return_date', [$dateFrom, $dateTo]);

        $totalRevenue   = (float) (clone $deliveredQuery)->sum('total_cost');
        $totalLaborCost = (float) (clone $deliveredQuery)->sum('labor_cost');

        $totalPartsCost = SparePart::whereBetween('purchase_date', [$dateFrom, $dateTo])->sum('subtotal');
        $totalPartsCost = (float) $totalPartsCost;

        $grossProfit  = $totalRevenue - $totalPartsCost;
        $profitMargin = $totalRevenue > 0 ? round(($grossProfit / $totalRevenue) * 100, 1) : 0;

        $tickets = (clone $deliveredQuery)
            ->with(['customer', 'technician', 'spareParts'])
            ->latest('actual_return_date')
            ->get()
            ->map(fn($t) => [
                'id'             => $t->id,
                'ticket_number'  => $t->ticket_number,
                'customer'       => $t->customer?->name,
                'technician'     => $t->technician?->name,
                'delivery_date'  => $t->actual_return_date?->toDateString(),
                'labor_cost'     => (float) $t->labor_cost,
                'parts_cost'     => (float) $t->spareParts->sum('subtotal'),
                'total_cost'     => (float) $t->total_cost,
            ]);

        return response()->json([
            'data' => [
                'summary' => [
                    'total_revenue'    => $totalRevenue,
                    'total_labor_cost' => $totalLaborCost,
                    'total_parts_cost' => $totalPartsCost,
                    'gross_profit'     => $grossProfit,
                    'profit_margin'    => $profitMargin,
                    'ticket_count'     => $tickets->count(),
                ],
                'tickets' => $tickets,
            ],
            'message' => 'Financial report retrieved successfully.',
        ]);
    }

    public function tickets(Request $request): JsonResponse
    {
        $query = SupportTicket::with(['customer', 'technician', 'category']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('support_type_id')) {
            $query->where('support_type_id', $request->support_type_id);
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
                    ->orWhereHas('customer', fn ($cq) => $cq->where('name', 'like', "%{$search}%"));
            });
        }

        $perPage = $request->input('per_page', 50);
        $tickets = $query->latest()->paginate(min($perPage, 200));

        return response()->json([
            'data' => SupportTicketResource::collection($tickets->items()),
            'message' => 'Tickets report retrieved successfully.',
            'meta' => [
                'current_page' => $tickets->currentPage(),
                'last_page' => $tickets->lastPage(),
                'per_page' => $tickets->perPage(),
                'total' => $tickets->total(),
            ],
        ]);
    }
}
