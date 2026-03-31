<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('spare_parts', function (Blueprint $table) {
            $table->dropColumn('supplier');
            $table->unsignedBigInteger('supplier_id')->nullable()->after('name');
        });

        // Make purchase_date nullable and add foreign key (raw SQL avoids doctrine/dbal dependency)
        DB::statement('ALTER TABLE spare_parts MODIFY purchase_date DATE NULL');
        DB::statement('ALTER TABLE spare_parts ADD CONSTRAINT spare_parts_supplier_id_foreign FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL');
    }

    public function down(): void {
        Schema::table('spare_parts', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
            $table->dropColumn('supplier_id');
            $table->string('supplier')->default('');
        });
        DB::statement('ALTER TABLE spare_parts MODIFY purchase_date DATE NOT NULL');
    }
};
