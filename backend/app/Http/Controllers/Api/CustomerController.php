<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Customer::withCount('tickets');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('document_number', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $customers = $query->latest()->paginate(15);

        return response()->json([
            'data' => CustomerResource::collection($customers->items()),
            'message' => 'Customers retrieved successfully.',
            'meta' => [
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
                'per_page' => $customers->perPage(),
                'total' => $customers->total(),
            ],
        ]);
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $customer = Customer::create($request->validated());

        return response()->json([
            'data' => new CustomerResource($customer),
            'message' => 'Customer created successfully.',
        ], 201);
    }

    public function show(Customer $customer): JsonResponse
    {
        $customer->load(['tickets' => function ($q) {
            $q->with(['technician', 'category'])->latest()->take(10);
        }]);

        return response()->json([
            'data' => new CustomerResource($customer),
            'message' => 'Customer retrieved successfully.',
        ]);
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): JsonResponse
    {
        $customer->update($request->validated());

        return response()->json([
            'data' => new CustomerResource($customer->fresh()),
            'message' => 'Customer updated successfully.',
        ]);
    }
}
