<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\MedioCobro;

class MedioCobroSeeder extends Seeder
{
    public function run(): void
    {
        $mediosCobro = [
            ['nombre' => 'Efectivo'],
            ['nombre' => 'Tarjeta de Débito'],
            ['nombre' => 'Tarjeta de Crédito'],
            ['nombre' => 'Transferencia Bancaria'],
            ['nombre' => 'Mercado Pago'],
        ];

        foreach ($mediosCobro as $medio) {
            MedioCobro::create($medio);
        }

        $this->command->info('5 medios de cobro de prueba creados exitosamente!');
    }
}