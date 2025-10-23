<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Equipo;
use App\Models\Cliente;

class EquipoSeeder extends Seeder
{
    public function run(): void
    {
        $clientes = Cliente::all();

        $equipos = [
            [
                'descripcion' => 'Notebook Lenovo con pantalla rota',
                'marca' => 'Lenovo',
                'modelo' => 'IdeaPad 320',
                'nro_serie' => 'SN-LEN-001',
                'cliente_id' => $clientes[0]->id,
            ],
            [
                'descripcion' => 'PC de escritorio no enciende',
                'marca' => 'HP',
                'modelo' => 'Pavilion',
                'nro_serie' => 'SN-HP-002',
                'cliente_id' => $clientes[1]->id,
            ],
            [
                'descripcion' => 'Monitor con líneas verticales',
                'marca' => 'Samsung',
                'modelo' => 'S24F350',
                'nro_serie' => 'SN-SAM-003',
                'cliente_id' => $clientes[2]->id,
            ],
            [
                'descripcion' => 'Teclado con teclas que no funcionan',
                'marca' => 'Logitech',
                'modelo' => 'K120',
                'nro_serie' => 'SN-LOG-004',
                'cliente_id' => $clientes[3]->id,
            ],
            [
                'descripcion' => 'Impresora atasca papel',
                'marca' => 'Epson',
                'modelo' => 'L3110',
                'nro_serie' => 'SN-EPS-005',
                'cliente_id' => $clientes[4]->id,
            ]
        ];

        foreach ($equipos as $equipo) {
            Equipo::create($equipo);
        }

        $this->command->info('5 equipos de prueba creados exitosamente!');
    }
}