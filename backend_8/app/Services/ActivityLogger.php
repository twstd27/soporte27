<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

class ActivityLogger
{
    public static function log(
        string $action,
        string $description,
        ?string $entityType = null,
        ?int $entityId = null,
        ?string $entityLabel = null,
        ?int $userId = null,
    ): void {
        ActivityLog::create([
            'user_id'      => $userId ?? Auth::id(),
            'action'       => $action,
            'entity_type'  => $entityType,
            'entity_id'    => $entityId,
            'entity_label' => $entityLabel,
            'description'  => $description,
        ]);
    }
}
