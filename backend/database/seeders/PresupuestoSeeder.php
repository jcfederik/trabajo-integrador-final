<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Presupuesto;
use App\Models\Reparacion;
use Carbon\Carbon;

class PresupuestoSeeder extends Seeder
{
    public function run(): void
    {
        $reparaciones = Reparacion::all();

        $presupuestos = [
            [
                'reparacion_id' => $reparaciones[0]->id,
                'fecha' => Carbon::now()->subDays(4),
                'monto_total' => 95000.00,
                'aceptado' => true,
            ],
            [
                'reparacion_id' => $reparaciones[1]->id,
                'fecha' => Carbon::now()->subDays(2),
                'monto_total' => 85000.00,
                'aceptado' => false,
            ],
            [
                'reparacion_id' => $reparaciones[2]->id,
                'fecha' => Carbon::now()->subDays(1),
                'monto_total' => 35000.00,
                'aceptado' => true,
            ]
        ];

        foreach ($presupuestos as $presupuesto) {
            Presupuesto::create($presupuesto);
        }

        $this->command->info('3 presupuestos de prueba creados exitosamente!');
    }
}