<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_number')->unique();
            $table->foreignId('customer_id')->constrained('customers')->onDelete('restrict');
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->foreignId('technician_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('category_id')->nullable()->constrained('support_categories')->onDelete('set null');
            $table->enum('tool_type', ['drill', 'suction_pump', 'extraction_motor', 'other']);
            $table->string('brand');
            $table->string('model');
            $table->string('serial_number')->nullable();
            $table->text('problem_description');
            $table->enum('support_type', ['repair', 'preventive_maintenance', 'corrective_maintenance']);
            $table->date('reception_date');
            $table->date('estimated_return_date')->nullable();
            $table->date('actual_return_date')->nullable();
            $table->enum('status', ['received', 'diagnosing', 'in_repair', 'waiting_parts', 'ready', 'delivered'])->default('received');
            $table->text('diagnosis')->nullable();
            $table->text('work_performed')->nullable();
            $table->decimal('labor_cost', 10, 2)->default(0);
            $table->decimal('total_cost', 10, 2)->default(0);
            $table->text('internal_notes')->nullable();
            $table->integer('warranty_days')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_tickets');
    }
};
