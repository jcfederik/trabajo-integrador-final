<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Proveedor;
use App\Models\Repuesto;

class ProveedorRepuestoSeeder extends Seeder
{
    public function run(): void
    {
        $proveedor1 = Proveedor::first();
        $proveedor2 = Proveedor::skip(1)->first();

        $repuestos = Repuesto::all();

        // Proveedor 1 vende todos, con 10% margen
        foreach ($repuestos as $r) {
            $proveedor1->repuestos()->attach($r->id, [
                'precio' => $r->costo_base * 1.10,
                'activo' => true
            ]);
        }

        // Proveedor 2 vende la mitad con 15% margen
        foreach ($repuestos->take(3) as $r) {
            $proveedor2->repuestos()->attach($r->id, [
                'precio' => $r->costo_base * 1.15,
                'activo' => true
            ]);
        }
    }
}
