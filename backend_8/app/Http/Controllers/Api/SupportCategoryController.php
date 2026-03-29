<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SupportCategoryResource;
use App\Models\SupportCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SupportCategory::query();
        if ($request->boolean('with_trashed') && $request->user()->isAdmin()) {
            $query->withTrashed();
        }

        return response()->json([
            'data' => SupportCategoryResource::collection($query->get()),
            'message' => 'Categories retrieved successfully.',
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:support_categories,name'],
            'description' => ['nullable', 'string'],
        ]);
        $category = SupportCategory::create($request->only('name', 'description'));
        return response()->json([
            'data' => new SupportCategoryResource($category),
            'message' => 'Category created successfully.',
        ], 201);
    }

    public function update(Request $request, SupportCategory $category): JsonResponse
    {
        $request->validate([
            'name' => ['sometimes', 'string', 'max:255', "unique:support_categories,name,{$category->id}"],
            'description' => ['nullable', 'string'],
        ]);
        $category->update($request->only('name', 'description'));
        return response()->json([
            'data' => new SupportCategoryResource($category->fresh()),
            'message' => 'Category updated successfully.',
        ]);
    }

    public function destroy(SupportCategory $category): JsonResponse
    {
        $category->delete();
        return response()->json(['data' => null, 'message' => 'Category deleted successfully.']);
    }

    public function restore(string $id): JsonResponse
    {
        $category = SupportCategory::withTrashed()->findOrFail($id);
        $category->restore();
        return response()->json([
            'data' => new SupportCategoryResource($category),
            'message' => 'Category restored successfully.',
        ]);
    }
}
