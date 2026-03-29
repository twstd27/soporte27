<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        Schema::create('support_types', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        $now = now();
        DB::table('support_types')->insert([
            ['name' => 'Reparación', 'description' => 'Reparación de averías y fallas.', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Mantenimiento Preventivo', 'description' => 'Mantenimiento programado para prevenir fallas.', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Mantenimiento Correctivo', 'description' => 'Corrección de fallas ya ocurridas.', 'created_at' => $now, 'updated_at' => $now],
        ]);
    }
    public function down(): void { Schema::dropIfExists('support_types'); }
};
