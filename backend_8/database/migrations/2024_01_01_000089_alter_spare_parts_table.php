<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Drop old supplier column using raw SQL (SQLite 3.35+ native support)
        DB::statement('ALTER TABLE spare_parts DROP COLUMN supplier');

        Schema::table('spare_parts', function (Blueprint $table) {
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->onDelete('set null');
            // Make purchase_date nullable (recreate is not needed — already date, just update default)
        });

        // Make purchase_date nullable via raw SQL (SQLite: recreate approach)
        DB::statement('CREATE TABLE spare_parts_temp AS SELECT * FROM spare_parts');
        DB::statement('DROP TABLE spare_parts');
        DB::statement('CREATE TABLE spare_parts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_id INTEGER NOT NULL,
            name VARCHAR(255) NOT NULL,
            supplier_id INTEGER NULL,
            unit_price DECIMAL(10,2) NOT NULL,
            quantity INTEGER NOT NULL,
            subtotal DECIMAL(10,2) NOT NULL,
            purchase_date DATE NULL,
            created_at TIMESTAMP NULL,
            updated_at TIMESTAMP NULL,
            FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
        )');
        DB::statement('INSERT INTO spare_parts SELECT id, ticket_id, name, supplier_id, unit_price, quantity, subtotal, purchase_date, created_at, updated_at FROM spare_parts_temp');
        DB::statement('DROP TABLE spare_parts_temp');
    }
    public function down(): void {
        Schema::table('spare_parts', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
            $table->dropColumn('supplier_id');
            $table->string('supplier')->nullable();
        });
    }
};
