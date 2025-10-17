<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Repuesto;

class RepuestoSeeder extends Seeder
{
    public function run(): void
    {
        $repuestos = [
            [
                'nombre' => 'Disco SSD 500GB',
                'stock' => 10,
                'costo_base' => 45000.00,
            ],
            [
                'nombre' => 'Memoria RAM 8GB DDR4',
                'stock' => 15,
                'costo_base' => 25000.00,
            ],
            [
                'nombre' => 'Pantalla LCD 15.6"',
                'stock' => 5,
                'costo_base' => 85000.00,
            ],
            [
                'nombre' => 'Teclado Universal',
                'stock' => 20,
                'costo_base' => 12000.00,
            ],
            [
                'nombre' => 'Mouse Óptico',
                'stock' => 25,
                'costo_base' => 8000.00,
            ]
        ];

        foreach ($repuestos as $repuesto) {
            Repuesto::create($repuesto);
        }

        $this->command->info('5 repuestos de prueba creados exitosamente!');
    }
}