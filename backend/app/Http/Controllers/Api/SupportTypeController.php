<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\SupportType;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportTypeController extends Controller {
    public function index(Request $request): JsonResponse {
        $query = SupportType::orderBy('name');
        if ($request->boolean('with_trashed') && $request->user()->isAdmin()) {
            $query->withTrashed();
        }
        return response()->json(['data' => $query->get()]);
    }
    public function store(Request $request): JsonResponse {
        $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:support_types,name'],
            'description' => ['nullable', 'string'],
        ]);
        $type = SupportType::create($request->only('name', 'description'));
        ActivityLogger::log('support_type_created', "Tipo de soporte \"{$type->name}\" creado", 'support_type', $type->id, $type->name);
        return response()->json(['data' => $type, 'message' => 'Support type created.'], 201);
    }
    public function update(Request $request, SupportType $supportType): JsonResponse {
        $request->validate([
            'name' => ['required', 'string', 'max:255', "unique:support_types,name,{$supportType->id}"],
            'description' => ['nullable', 'string'],
        ]);
        $supportType->update($request->only('name', 'description'));
        ActivityLogger::log('support_type_updated', "Tipo de soporte \"{$supportType->name}\" actualizado", 'support_type', $supportType->id, $supportType->name);
        return response()->json(['data' => $supportType->fresh(), 'message' => 'Support type updated.']);
    }
    public function destroy(SupportType $supportType): JsonResponse {
        ActivityLogger::log('support_type_deleted', "Tipo de soporte \"{$supportType->name}\" eliminado", 'support_type', $supportType->id, $supportType->name);
        $supportType->delete();
        return response()->json(['data' => null, 'message' => 'Support type deleted.']);
    }
    public function restore(string $id): JsonResponse {
        $type = SupportType::withTrashed()->findOrFail($id);
        $type->restore();
        ActivityLogger::log('support_type_restored', "Tipo de soporte \"{$type->name}\" restaurado", 'support_type', $type->id, $type->name);
        return response()->json(['data' => $type, 'message' => 'Support type restored.']);
    }
}
