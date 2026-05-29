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
                'nombre' => 'Filtro de aire para motosierra',
                'stock' => 30,
                'costo_base' => 3500.00,
            ],
            [
                'nombre' => 'Bujía NGK BPMR7A',
                'stock' => 50,
                'costo_base' => 2200.00,
            ],
            [
                'nombre' => 'Carburador para motoguadaña 43cc',
                'stock' => 15,
                'costo_base' => 14500.00,
            ],
            [
                'nombre' => 'Cuchilla para cortadora de césped 20"',
                'stock' => 12,
                'costo_base' => 18000.00,
            ],
            [
                'nombre' => 'Correa trapezoidal A-33',
                'stock' => 25,
                'costo_base' => 7500.00,
            ],
            [
                'nombre' => 'Filtro de combustible universal',
                'stock' => 40,
                'costo_base' => 1200.00,
            ],
            [
                'nombre' => 'Embrague para motosierra 52cc',
                'stock' => 10,
                'costo_base' => 19500.00,
            ],
            [
                'nombre' => 'Retén de cigüeñal 20x35x7',
                'stock' => 35,
                'costo_base' => 900.00,
            ],
            [
                'nombre' => 'Aceite 2T sintético 1L',
                'stock' => 60,
                'costo_base' => 4500.00,
            ],
            [
                'nombre' => 'Bobina de encendido para motor estacionario 6.5HP',
                'stock' => 8,
                'costo_base' => 23000.00,
            ],
        ];

        foreach ($repuestos as $repuesto) {
            Repuesto::create($repuesto);
        }

        $this->command->info('Repuestos típicos de maquinaria y jardinería creados exitosamente!');
    }
}
