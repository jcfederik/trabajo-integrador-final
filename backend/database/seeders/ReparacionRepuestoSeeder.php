<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\ReparacionRepuesto;
use App\Models\Reparacion;
use App\Models\Repuesto;

class ReparacionRepuestoSeeder extends Seeder
{
    public function run(): void
    {
        $reparaciones = Reparacion::all();
        $repuestos = Repuesto::all();

        $reparacionRepuestos = [
            [
                'reparacion_id' => $reparaciones[0]->id,
                'repuesto_id' => $repuestos[0]->id, // SSD
                'cantidad' => 1,
                'costo_unitario' => 45000.00,
            ],
            [
                'reparacion_id' => $reparaciones[0]->id,
                'repuesto_id' => $repuestos[1]->id, // RAM
                'cantidad' => 2,
                'costo_unitario' => 25000.00,
            ],
            [
                'reparacion_id' => $reparaciones[1]->id,
                'repuesto_id' => $repuestos[2]->id, // Pantalla
                'cantidad' => 1,
                'costo_unitario' => 85000.00,
            ]
        ];

        foreach ($reparacionRepuestos as $reparacionRepuesto) {
            ReparacionRepuesto::create($reparacionRepuesto);
        }

        $this->command->info('Relaciones reparación-repuesto creadas exitosamente!');
    }
}