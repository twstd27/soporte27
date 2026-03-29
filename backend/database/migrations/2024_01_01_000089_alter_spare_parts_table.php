<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('spare_parts', function (Blueprint $table) {
            $table->dropColumn('supplier');
            $table->foreignId('supplier_id')->nullable()->after('name')->constrained('suppliers')->onDelete('set null');
            $table->date('purchase_date')->nullable()->change();
        });
    }
    public function down(): void {
        Schema::table('spare_parts', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
            $table->dropColumn('supplier_id');
            $table->string('supplier')->after('name');
        });
    }
};
