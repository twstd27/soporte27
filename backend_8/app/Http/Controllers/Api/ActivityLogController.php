<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ActivityLog::with('user')->latest();

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('entity_type')) {
            $query->where('entity_type', $request->entity_type);
        }

        if ($request->filled('action')) {
            $query->where('action', 'like', "%{$request->action}%");
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $perPage = min((int) $request->input('per_page', 50), 200);
        $logs = $query->paginate($perPage);

        return response()->json([
            'data' => collect($logs->items())->map(function($l) {
                return [
                    'id'           => $l->id,
                    'action'       => $l->action,
                    'entity_type'  => $l->entity_type,
                    'entity_id'    => $l->entity_id,
                    'entity_label' => $l->entity_label,
                    'description'  => $l->description,
                    'user'         => $l->user ? ['id' => $l->user->id, 'name' => $l->user->name] : null,
                    'created_at'   => $l->created_at->toIso8601String(),
                ];
            }),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page'    => $logs->lastPage(),
                'per_page'     => $logs->perPage(),
                'total'        => $logs->total(),
            ],
        ]);
    }
}
