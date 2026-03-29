<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller {
    public function index(Request $request): JsonResponse {
        $query = Supplier::orderBy('name');
        if ($request->boolean('with_trashed') && $request->user()->isAdmin()) {
            $query->withTrashed();
        }
        return response()->json(['data' => $query->get()]);
    }
    public function store(Request $request): JsonResponse {
        $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:suppliers,name'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email'],
        ]);
        $supplier = Supplier::create($request->only('name', 'contact_name', 'phone', 'email'));
        ActivityLogger::log('supplier_created', "Proveedor \"{$supplier->name}\" creado", 'supplier', $supplier->id, $supplier->name);
        return response()->json(['data' => $supplier, 'message' => 'Supplier created.'], 201);
    }
    public function update(Request $request, Supplier $supplier): JsonResponse {
        $request->validate([
            'name' => ['required', 'string', 'max:255', "unique:suppliers,name,{$supplier->id}"],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email'],
        ]);
        $supplier->update($request->only('name', 'contact_name', 'phone', 'email'));
        ActivityLogger::log('supplier_updated', "Proveedor \"{$supplier->name}\" actualizado", 'supplier', $supplier->id, $supplier->name);
        return response()->json(['data' => $supplier->fresh(), 'message' => 'Supplier updated.']);
    }
    public function destroy(Supplier $supplier): JsonResponse {
        ActivityLogger::log('supplier_deleted', "Proveedor \"{$supplier->name}\" eliminado", 'supplier', $supplier->id, $supplier->name);
        $supplier->delete();
        return response()->json(['data' => null, 'message' => 'Supplier deleted.']);
    }
    public function restore(string $id): JsonResponse {
        $supplier = Supplier::withTrashed()->findOrFail($id);
        $supplier->restore();
        ActivityLogger::log('supplier_restored', "Proveedor \"{$supplier->name}\" restaurado", 'supplier', $supplier->id, $supplier->name);
        return response()->json(['data' => $supplier, 'message' => 'Supplier restored.']);
    }
}
