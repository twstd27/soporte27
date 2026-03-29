<?php

use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\CompanyInfoController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SparePartController;
use App\Http\Controllers\Api\SupportCategoryController;
use App\Http\Controllers\Api\SupportTicketController;
use App\Http\Controllers\Api\SupportTypeController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\SystemSettingController;
use App\Http\Controllers\Api\ToolPhotoController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/auth/login', [AuthController::class, 'login']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Tickets
    Route::apiResource('tickets', SupportTicketController::class)->except(['destroy']);
    Route::patch('tickets/{ticket}/status', [SupportTicketController::class, 'updateStatus']);
    Route::post('/tickets/{ticket}/duplicate', [SupportTicketController::class, 'duplicate']);
    Route::post('tickets/{ticket}/photos', [ToolPhotoController::class, 'store']);
    Route::delete('tickets/{ticket}/photos/{photo}', [ToolPhotoController::class, 'destroy']);

    // Spare Parts - shallow nested resource
    Route::get('tickets/{ticket}/parts', [SparePartController::class, 'index']);
    Route::post('tickets/{ticket}/parts', [SparePartController::class, 'store']);
    Route::put('parts/{part}', [SparePartController::class, 'update']);
    Route::patch('parts/{part}', [SparePartController::class, 'update']);
    Route::delete('parts/{part}', [SparePartController::class, 'destroy']);

    // Customers
    Route::apiResource('customers', CustomerController::class)->except(['destroy']);

    // Categories - read for all authenticated users
    Route::get('categories', [SupportCategoryController::class, 'index']);

    // Catalog reads - available to all authenticated users
    Route::get('brands', [BrandController::class, 'index']);
    Route::get('suppliers', [SupplierController::class, 'index']);
    Route::get('support-types', [SupportTypeController::class, 'index']);

    // Config reads - available to all authenticated users (needed for currency formatting, thermal print, etc.)
    Route::get('settings', [SystemSettingController::class, 'index']);
    Route::get('company', [CompanyInfoController::class, 'show']);

    // Technician own stats
    Route::get('reports/technician-summary', [ReportController::class, 'technicianSummary']);

    // Notifications
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::patch('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::patch('notifications/{id}/read', [NotificationController::class, 'markAsRead']);

    // Admin-only routes
    Route::middleware('role:admin')->group(function () {
        // Ticket delete/restore (admin only)
        Route::delete('tickets/{ticket}', [SupportTicketController::class, 'destroy']);
        Route::post('tickets/{id}/restore', [SupportTicketController::class, 'restore']);

        // Category CUD (admin only)
        Route::post('categories', [SupportCategoryController::class, 'store']);
        Route::put('categories/{category}', [SupportCategoryController::class, 'update']);
        Route::patch('categories/{category}', [SupportCategoryController::class, 'update']);
        Route::delete('categories/{category}', [SupportCategoryController::class, 'destroy']);
        Route::post('categories/{id}/restore', [SupportCategoryController::class, 'restore']);

        // Brands CUD (admin only)
        Route::post('brands', [BrandController::class, 'store']);
        Route::put('brands/{brand}', [BrandController::class, 'update']);
        Route::delete('brands/{brand}', [BrandController::class, 'destroy']);
        Route::post('brands/{id}/restore', [BrandController::class, 'restore']);

        // Suppliers CUD (admin only)
        Route::post('suppliers', [SupplierController::class, 'store']);
        Route::put('suppliers/{supplier}', [SupplierController::class, 'update']);
        Route::delete('suppliers/{supplier}', [SupplierController::class, 'destroy']);
        Route::post('suppliers/{id}/restore', [SupplierController::class, 'restore']);

        // Support Types CUD (admin only)
        Route::post('support-types', [SupportTypeController::class, 'store']);
        Route::put('support-types/{supportType}', [SupportTypeController::class, 'update']);
        Route::delete('support-types/{supportType}', [SupportTypeController::class, 'destroy']);
        Route::post('support-types/{id}/restore', [SupportTypeController::class, 'restore']);

        // Users
        Route::apiResource('users', UserController::class)->except(['show']);
        Route::patch('users/{user}/toggle-active', [UserController::class, 'toggleActive']);

        // Reports
        Route::prefix('reports')->group(function () {
            Route::get('summary', [ReportController::class, 'summary']);
            Route::get('by-status', [ReportController::class, 'byStatus']);
            Route::get('by-support-type', [ReportController::class, 'bySupportType']);
            Route::get('costs', [ReportController::class, 'costs']);
            Route::get('tickets', [ReportController::class, 'tickets']);
            Route::get('financial', [ReportController::class, 'financial']);
        });

        Route::get('activity-logs', [ActivityLogController::class, 'index']);

        // System settings (write admin only)
        Route::patch('settings', [SystemSettingController::class, 'update']);

        // Company info (write admin only)
        Route::post('company', [CompanyInfoController::class, 'update']);
    });
});
