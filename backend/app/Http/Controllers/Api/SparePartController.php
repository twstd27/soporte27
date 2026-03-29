<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSparePartRequest;
use App\Http\Requests\UpdateSparePartRequest;
use App\Http\Resources\SparePartResource;
use App\Models\SparePart;
use App\Models\SupportTicket;
use Illuminate\Http\JsonResponse;

class SparePartController extends Controller
{
    public function index(SupportTicket $ticket): JsonResponse
    {
        $parts = $ticket->spareParts()->with('supplier')->latest()->get();

        return response()->json([
            'data' => SparePartResource::collection($parts),
            'message' => 'Spare parts retrieved successfully.',
        ]);
    }

    public function store(StoreSparePartRequest $request, SupportTicket $ticket): JsonResponse
    {
        $data = $request->validated();
        $data['ticket_id'] = $ticket->id;

        $part = SparePart::create($data);
        $ticket->recalculateTotalCost();
        $part->load('supplier');

        return response()->json([
            'data' => new SparePartResource($part),
            'message' => 'Spare part created successfully.',
        ], 201);
    }

    public function update(UpdateSparePartRequest $request, SparePart $part): JsonResponse
    {
        $part->update($request->validated());
        $part->ticket->recalculateTotalCost();

        return response()->json([
            'data' => new SparePartResource($part->fresh()->load('supplier')),
            'message' => 'Spare part updated successfully.',
        ]);
    }

    public function destroy(SparePart $part): JsonResponse
    {
        $ticket = $part->ticket;
        $part->delete();
        $ticket->recalculateTotalCost();

        return response()->json([
            'data' => null,
            'message' => 'Spare part deleted successfully.',
        ]);
    }
}
