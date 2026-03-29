<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Drop old columns using raw SQL (SQLite 3.35+ native support, no doctrine/dbal needed)
        DB::statement('ALTER TABLE support_tickets DROP COLUMN tool_type');
        DB::statement('ALTER TABLE support_tickets DROP COLUMN brand');
        DB::statement('ALTER TABLE support_tickets DROP COLUMN support_type');

        Schema::table('support_tickets', function (Blueprint $table) {
            $table->foreignId('brand_id')->nullable()->constrained('brands')->onDelete('set null');
            $table->foreignId('support_type_id')->nullable()->constrained('support_types')->onDelete('set null');
            $table->text('description')->nullable();
        });
    }
    public function down(): void {
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->dropColumn(['brand_id', 'support_type_id', 'description']);
            $table->string('tool_type');
            $table->string('brand');
            $table->string('support_type');
        });
    }
};
