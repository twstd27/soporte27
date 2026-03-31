<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompanyInfo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class CompanyInfoController extends Controller
{
    public function show(): JsonResponse
    {
        $company = CompanyInfo::firstOrCreate(
            [],
            ['name' => 'Centro de Soporte Técnico']
        );

        return response()->json([
            'data' => $this->format($company),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'name'        => ['sometimes', 'string', 'max:255'],
            'tax_id'      => ['nullable', 'string', 'max:50'],
            'address'     => ['nullable', 'string', 'max:500'],
            'phone'       => ['nullable', 'string', 'max:50'],
            'email'       => ['nullable', 'email'],
            'website'     => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'logo'        => ['nullable', 'image', 'mimes:jpeg,jpg,png,gif,webp', 'max:2048'],
        ]);

        $company = CompanyInfo::firstOrCreate([], ['name' => 'Centro de Soporte Técnico']);

        $data = $request->only('name', 'tax_id', 'address', 'phone', 'email', 'website', 'description');

        if ($request->hasFile('logo')) {
            // Delete old logo
            if ($company->logo_path && File::exists(public_path($company->logo_path))) {
                File::delete(public_path($company->logo_path));
            }

            $file = $request->file('logo');
            $dir  = public_path('company');
            File::ensureDirectoryExists($dir);
            $filename = 'logo-' . Str::uuid() . '.' . $file->getClientOriginalExtension();
            $file->move($dir, $filename);
            $data['logo_path'] = "company/{$filename}";
        }

        $company->update($data);

        return response()->json([
            'data'    => $this->format($company->fresh()),
            'message' => 'Company info updated successfully.',
        ]);
    }

    private function format(CompanyInfo $company): array
    {
        return [
            'id'          => $company->id,
            'name'        => $company->name,
            'tax_id'      => $company->tax_id,
            'address'     => $company->address,
            'phone'       => $company->phone,
            'email'       => $company->email,
            'website'     => $company->website,
            'description' => $company->description,
            'logo_url'    => $company->logo_path ? url($company->logo_path) : null,
            'updated_at'  => optional($company->updated_at)->toISOString(),
        ];
    }
}
