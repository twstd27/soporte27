<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\SupportCategory;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user
        User::create([
            'name' => 'Admin',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'phone' => '+57 300 000 0001',
            'is_active' => true,
        ]);

        // Technician user
        User::create([
            'name' => 'Juan Técnico',
            'email' => 'tecnico@test.com',
            'password' => Hash::make('password'),
            'role' => 'technician',
            'phone' => '+57 300 000 0002',
            'is_active' => true,
        ]);

        // Support categories
        SupportCategory::insert([
            [
                'name' => 'Eléctrico',
                'description' => 'Problemas relacionados con componentes eléctricos y cableado.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Mecánico',
                'description' => 'Problemas de piezas mecánicas, engranajes y estructuras.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Hidráulico',
                'description' => 'Sistemas hidráulicos, bombas y válvulas.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Sample customers
        $customers = [
            [
                'name' => 'Carlos Rodríguez',
                'company' => 'Construcciones CR S.A.S.',
                'phone' => '+57 311 111 1111',
                'email' => 'carlos@construccionescr.com',
                'document_number' => '12345678',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'María González',
                'company' => null,
                'phone' => '+57 322 222 2222',
                'email' => 'maria.gonzalez@email.com',
                'document_number' => '23456789',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Empresa Industrial S.A.',
                'company' => 'Empresa Industrial S.A.',
                'phone' => '+57 333 333 3333',
                'email' => 'contacto@empresaindustrial.com',
                'document_number' => '900123456',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Luis Fernando Pérez',
                'company' => 'Minería del Norte Ltda.',
                'phone' => '+57 344 444 4444',
                'email' => 'lfperez@minerianorte.com',
                'document_number' => '34567890',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Talleres Mecánicos Unidos',
                'company' => 'Talleres Mecánicos Unidos',
                'phone' => '+57 355 555 5555',
                'email' => 'info@talleresunidos.com',
                'document_number' => '800987654',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        Customer::insert($customers);
    }
}
