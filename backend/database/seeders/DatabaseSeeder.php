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
            'phone' => '',
            'is_active' => true,
        ]);

        // Technician user
        User::create([
            'name' => 'Juan Técnico',
            'email' => 'tecnico@test.com',
            'password' => Hash::make('password'),
            'role' => 'technician',
            'phone' => '',
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
    }
}
