<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemSettingController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = SystemSetting::all()->groupBy('group')->map(function ($group) {
            return $group->map(fn ($s) => [
                'id'    => $s->id,
                'key'   => $s->key,
                'value' => $s->value,
                'type'  => $s->type,
                'label' => $s->label,
                'group' => $s->group,
            ])->values();
        });

        return response()->json(['data' => $settings]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'settings'       => ['required', 'array'],
            'settings.*.key' => ['required', 'string'],
            'settings.*.value' => ['nullable'],
        ]);

        foreach ($request->settings as $item) {
            SystemSetting::where('key', $item['key'])->update(['value' => $item['value']]);
        }

        return response()->json(['message' => 'Settings updated successfully.']);
    }
}
