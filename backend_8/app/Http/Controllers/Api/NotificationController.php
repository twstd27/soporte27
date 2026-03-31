<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->limit(30)
            ->get()
            ->map(function($n) {
                return [
                    'id'         => $n->id,
                    'type'       => $n->data['type'] ?? null,
                    'data'       => $n->data,
                    'read_at'    => optional($n->read_at)->toIso8601String(),
                    'created_at' => $n->created_at->toIso8601String(),
                ];
            });

        return response()->json([
            'data'         => $notifications,
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return response()->json([
            'data'         => null,
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['data' => null, 'unread_count' => 0]);
    }
}
