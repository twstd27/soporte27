<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BrandController extends Controller {
    public function index(Request $request): JsonResponse {
        $query = Brand::orderBy('name');
        if ($request->boolean('with_trashed') && $request->user()->isAdmin()) {
            $query->withTrashed();
        }
        return response()->json(['data' => $query->get()]);
    }
    public function store(Request $request): JsonResponse {
        $request->validate(['name' => ['required', 'string', 'max:255', 'unique:brands,name']]);
        $brand = Brand::create($request->only('name'));
        ActivityLogger::log('brand_created', "Marca \"{$brand->name}\" creada", 'brand', $brand->id, $brand->name);
        return response()->json(['data' => $brand, 'message' => 'Brand created.'], 201);
    }
    public function update(Request $request, Brand $brand): JsonResponse {
        $request->validate(['name' => ['required', 'string', 'max:255', "unique:brands,name,{$brand->id}"]]);
        $brand->update($request->only('name'));
        ActivityLogger::log('brand_updated', "Marca \"{$brand->name}\" actualizada", 'brand', $brand->id, $brand->name);
        return response()->json(['data' => $brand->fresh(), 'message' => 'Brand updated.']);
    }
    public function destroy(Brand $brand): JsonResponse {
        ActivityLogger::log('brand_deleted', "Marca \"{$brand->name}\" eliminada", 'brand', $brand->id, $brand->name);
        $brand->delete();
        return response()->json(['data' => null, 'message' => 'Brand deleted.']);
    }
    public function restore(string $id): JsonResponse {
        $brand = Brand::withTrashed()->findOrFail($id);
        $brand->restore();
        ActivityLogger::log('brand_restored', "Marca \"{$brand->name}\" restaurada", 'brand', $brand->id, $brand->name);
        return response()->json(['data' => $brand, 'message' => 'Brand restored.']);
    }
}
