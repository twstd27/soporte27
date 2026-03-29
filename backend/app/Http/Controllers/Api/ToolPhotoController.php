<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ToolPhotoResource;
use App\Models\SupportTicket;
use App\Models\ToolPhoto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class ToolPhotoController extends Controller
{
    public function store(Request $request, SupportTicket $ticket): JsonResponse
    {
        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpeg,jpg,png,gif,webp', 'max:5120'],
        ]);

        $existingCount = $ticket->photos()->count();

        if ($existingCount >= 3) {
            return response()->json([
                'message' => 'Maximum of 3 photos allowed per ticket.',
            ], 422);
        }

        $file = $request->file('photo');
        $dir  = public_path("ticket-photos/{$ticket->id}");

        File::ensureDirectoryExists($dir);

        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $file->move($dir, $filename);

        $relativePath = "ticket-photos/{$ticket->id}/{$filename}";

        $photo = ToolPhoto::create([
            'ticket_id'     => $ticket->id,
            'file_path'     => $relativePath,
            'original_name' => $file->getClientOriginalName(),
            'sort_order'    => $existingCount + 1,
        ]);

        return response()->json([
            'data'    => new ToolPhotoResource($photo),
            'message' => 'Photo uploaded successfully.',
        ], 201);
    }

    public function destroy(SupportTicket $ticket, ToolPhoto $photo): JsonResponse
    {
        if ($photo->ticket_id !== $ticket->id) {
            return response()->json([
                'message' => 'Photo does not belong to this ticket.',
            ], 404);
        }

        $fullPath = public_path($photo->file_path);
        if (File::exists($fullPath)) {
            File::delete($fullPath);
        }

        $photo->delete();

        return response()->json([
            'data'    => null,
            'message' => 'Photo deleted successfully.',
        ]);
    }
}
