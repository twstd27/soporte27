<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogger;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        $users = $query->latest()->paginate(15);

        return response()->json([
            'data' => UserResource::collection($users->items()),
            'message' => 'Users retrieved successfully.',
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = User::create($request->validated());

        ActivityLogger::log('user_created', "Usuario \"{$user->name}\" creado ({$user->role})", 'user', $user->id, $user->name);

        return response()->json([
            'data' => new UserResource($user),
            'message' => 'User created successfully.',
        ], 201);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        return response()->json([
            'data' => new UserResource($user->fresh()),
            'message' => 'User updated successfully.',
        ]);
    }

    public function toggleActive(User $user): JsonResponse
    {
        $user->is_active = !$user->is_active;
        $user->save();

        $action = $user->is_active ? 'user_activated' : 'user_deactivated';
        $desc   = $user->is_active ? "Usuario \"{$user->name}\" activado" : "Usuario \"{$user->name}\" desactivado";
        ActivityLogger::log($action, $desc, 'user', $user->id, $user->name);

        return response()->json([
            'data' => new UserResource($user),
            'message' => $user->is_active ? 'User activated successfully.' : 'User deactivated successfully.',
        ]);
    }
}
