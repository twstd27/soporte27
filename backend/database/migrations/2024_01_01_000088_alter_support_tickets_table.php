<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->dropColumn(['tool_type', 'brand', 'support_type']);
            $table->foreignId('brand_id')->nullable()->after('category_id')->constrained('brands')->onDelete('set null');
            $table->foreignId('support_type_id')->nullable()->after('serial_number')->constrained('support_types')->onDelete('set null');
            $table->text('description')->nullable()->after('serial_number');
        });
    }
    public function down(): void {
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->dropForeign(['brand_id']);
            $table->dropForeign(['support_type_id']);
            $table->dropColumn(['brand_id', 'support_type_id', 'description']);
            $table->enum('tool_type', ['drill','suction_pump','extraction_motor','other'])->after('category_id');
            $table->string('brand')->after('tool_type');
            $table->enum('support_type', ['repair','preventive_maintenance','corrective_maintenance'])->after('problem_description');
        });
    }
};
