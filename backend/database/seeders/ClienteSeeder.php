<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Cliente;

class ClienteSeeder extends Seeder
{
    public function run(): void
    {
        $clientes = [
            [
                'nombre' => 'María González',
                'email' => 'maria.gonzalez@email.com',
                'telefono' => '+54 9 345 4123456',
            ],
            [
                'nombre' => 'Carlos Rodríguez',
                'email' => 'carlos.rodriguez@email.com',
                'telefono' => '+54 9 345 4234567',
            ],
            [
                'nombre' => 'Ana Martínez',
                'email' => 'ana.martinez@email.com',
                'telefono' => '+54 9 345 4345678',
            ],
            [
                'nombre' => 'Luis Fernández',
                'email' => 'luis.fernandez@email.com',
                'telefono' => '+54 9 345 4456789',
            ],
            [
                'nombre' => 'Laura Pérez',
                'email' => 'laura.perez@email.com',
                'telefono' => '+54 9 345 4567890',
            ]
        ];

        foreach ($clientes as $cliente) {
            Cliente::create($cliente);
        }

        $this->command->info('5 clientes de prueba creados exitosamente!');
    }
}