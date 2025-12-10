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

        if ($clientes->count() < 5) {
            $this->command->warn('No hay suficientes clientes para asignar equipos.');
            return;
        }

        $equipos = [
            [
                'descripcion' => 'Motosierra con dificultades de encendido',
                'marca' => 'Stihl',
                'modelo' => 'MS 170',
                'nro_serie' => 'STH-MS170-001',
                'cliente_id' => $clientes[0]->id,
            ],
            [
                'descripcion' => 'Motoguadaña pierde potencia al acelerar',
                'marca' => 'Husqvarna',
                'modelo' => '128R',
                'nro_serie' => 'HSQ-128R-002',
                'cliente_id' => $clientes[1]->id,
            ],
            [
                'descripcion' => 'Cortadora de césped no arranca',
                'marca' => 'Honda',
                'modelo' => 'HRR216',
                'nro_serie' => 'HND-HRR216-003',
                'cliente_id' => $clientes[2]->id,
            ],
            [
                'descripcion' => 'Generador hace ruido excesivo y vibra',
                'marca' => 'Gamma',
                'modelo' => 'GE-3500',
                'nro_serie' => 'GMM-GE3500-004',
                'cliente_id' => $clientes[3]->id,
            ],
            [
                'descripcion' => 'Motor estacionario presenta pérdida de combustible',
                'marca' => 'Briggs & Stratton',
                'modelo' => 'CR950',
                'nro_serie' => 'BGS-CR950-005',
                'cliente_id' => $clientes[4]->id,
            ]
        ];

        foreach ($equipos as $equipo) {
            Equipo::create($equipo);
        }

        $this->command->info('5 equipos de maquinaria y jardinería creados exitosamente!');
    }
}
