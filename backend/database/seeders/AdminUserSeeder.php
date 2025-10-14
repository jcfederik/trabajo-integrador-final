<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Verificar si el usuario admin ya existe
        if (!User::where('nombre', 'admin')->exists()) {
            User::create([
                'nombre' => 'admin',
                'tipo' => 'administrador',
                'password' => Hash::make('admin123'), // Cambia esta contraseña
            ]);
            
            $this->command->info('Usuario administrador creado exitosamente!');
            $this->command->info('Usuario: admin');
            $this->command->info('Contraseña: admin123');
        } else {
            $this->command->info('El usuario administrador ya existe.');
        }
    }
}