<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('string'); // string, integer, decimal, boolean
            $table->string('label');
            $table->string('group')->default('general');
            $table->timestamps();
        });

        // Seed default settings
        $now = now();
        DB::table('system_settings')->insert([
            ['key' => 'currency', 'value' => 'COP', 'type' => 'string', 'label' => 'Moneda del sistema', 'group' => 'finance', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'currency_symbol', 'value' => '$', 'type' => 'string', 'label' => 'Símbolo de moneda', 'group' => 'finance', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'quantity_decimals', 'value' => '2', 'type' => 'integer', 'label' => 'Decimales para cantidades', 'group' => 'finance', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'price_decimals', 'value' => '0', 'type' => 'integer', 'label' => 'Decimales para precios', 'group' => 'finance', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'tax_rate', 'value' => '19', 'type' => 'decimal', 'label' => 'Tasa de impuesto (%)', 'group' => 'finance', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'ticket_prefix', 'value' => 'TKT', 'type' => 'string', 'label' => 'Prefijo de tickets', 'group' => 'tickets', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'max_photos_per_ticket', 'value' => '3', 'type' => 'integer', 'label' => 'Máximo de fotos por ticket', 'group' => 'tickets', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'default_warranty_days', 'value' => '30', 'type' => 'integer', 'label' => 'Días de garantía por defecto', 'group' => 'tickets', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'working_hours_start', 'value' => '08:00', 'type' => 'string', 'label' => 'Hora de inicio de atención', 'group' => 'schedule', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'working_hours_end', 'value' => '18:00', 'type' => 'string', 'label' => 'Hora de cierre de atención', 'group' => 'schedule', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'working_days', 'value' => 'Lunes a Viernes', 'type' => 'string', 'label' => 'Días laborales', 'group' => 'schedule', 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
