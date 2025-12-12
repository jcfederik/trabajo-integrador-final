<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CompraRepuesto;
use App\Models\Proveedor;
use App\Models\Repuesto;
use App\Models\HistorialStock;

class CompraRepuestoSeeder extends Seeder
{
    public function run(): void
    {
        $proveedores = Proveedor::all();
        $repuestos   = Repuesto::all();

        $compras = [
            [
                'proveedor_id' => $proveedores[0]->id,
                'repuesto_id'  => $repuestos[0]->id,
                'numero_comprobante' => 'FAC-001-0001',
                'cantidad'     => 5,
                'total'        => 225000.00,
                'estado'       => 'procesado', // ← CORREGIDO
            ],
            [
                'proveedor_id' => $proveedores[1]->id,
                'repuesto_id'  => $repuestos[1]->id,
                'numero_comprobante' => 'FAC-002-0001',
                'cantidad'     => 10,
                'total'        => 250000.00,
                'estado'       => 'pendiente',
            ]
        ];

        foreach ($compras as $compra) {

            $precioUnitario = $compra['total'] / $compra['cantidad'];

            // 1) Crear compra
            $c = CompraRepuesto::create([
                'proveedor_id' => $compra['proveedor_id'],
                'repuesto_id'  => $compra['repuesto_id'],
                'numero_comprobante' => $compra['numero_comprobante'],
                'cantidad' => $compra['cantidad'],
                'precio_unitario' => $precioUnitario,   // ← OBLIGATORIO
                'total' => $compra['total'],
                'estado' => $compra['estado'],
                'usuario_id' => 1
            ]);

            // 2) Actualizar stock
            $repuesto = Repuesto::find($compra['repuesto_id']);

            $stockAnterior = $repuesto->stock;
            $repuesto->stock += $compra['cantidad'];
            $repuesto->save();

            // 3) Registrar historial
            HistorialStock::create([
                'repuesto_id'    => $repuesto->id,
                'tipo_mov'       => 'COMPRA',
                'cantidad'       => $compra['cantidad'],
                'stock_anterior' => $stockAnterior,
                'stock_nuevo'    => $repuesto->stock,
                'origen_id'      => $c->id,
                'origen_tipo'    => 'compra_repuesto',
                'usuario_id'     => 1,
            ]);
        }


        $this->command->info('Compras de repuestos creadas con stock + historial!');
    }
}
