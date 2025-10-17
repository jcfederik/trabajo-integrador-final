<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Proveedor;

class ProveedorSeeder extends Seeder
{
    public function run(): void
    {
        $proveedores = [
            [
                'razon_social' => 'TecnoParts S.A.',
                'cuit' => '30-12345678-9',
                'direccion' => 'Av. Corrientes 1234',
                'telefono' => '+54 11 4321-5678',
                'email' => 'ventas@tecnoparts.com',
            ],
            [
                'razon_social' => 'ElectroComponentes S.R.L.',
                'cuit' => '30-87654321-0',
                'direccion' => 'Calle Florida 567',
                'telefono' => '+54 11 4765-4321',
                'email' => 'info@electrocomponentes.com',
            ],
            [
                'razon_social' => 'Repuestos Digitales S.A.',
                'cuit' => '30-11223344-5',
                'direccion' => 'Av. Santa Fe 2345',
                'telefono' => '+54 11 4987-6543',
                'email' => 'contacto@repuestosdigitales.com',
            ]
        ];

        foreach ($proveedores as $proveedor) {
            Proveedor::create($proveedor);
        }

        $this->command->info('3 proveedores de prueba creados exitosamente!');
    }
}