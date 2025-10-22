<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\CompraRepuesto;
use App\Models\Proveedor;
use App\Models\Repuesto;

class CompraRepuestoSeeder extends Seeder
{
    public function run(): void
    {
        $proveedores = Proveedor::all();
        $repuestos = Repuesto::all();

        $compras = [
            [
                'proveedor_id' => $proveedores[0]->id,
                'repuesto_id' => $repuestos[0]->id,
                'numero_comprobante' => 'FAC-001-0001',
                'cantidad' => 5,
                'total' => 225000.00,
                'estado' => 'completado',
            ],
            [
                'proveedor_id' => $proveedores[1]->id,
                'repuesto_id' => $repuestos[1]->id,
                'numero_comprobante' => 'FAC-002-0001',
                'cantidad' => 10,
                'total' => 250000.00,
                'estado' => 'pendiente',
            ]
        ];

        foreach ($compras as $compra) {
            CompraRepuesto::create($compra);
        }

        $this->command->info('Compras de repuestos de prueba creadas exitosamente!');
    }
}