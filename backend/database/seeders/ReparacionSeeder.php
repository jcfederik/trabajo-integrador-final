<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Reparacion;
use App\Models\Equipo;
use App\Models\User;
use Carbon\Carbon;

class ReparacionSeeder extends Seeder
{
    public function run(): void
    {
        $equipos = Equipo::all();
        $tecnicos = User::where('tipo', 'tecnico')->get();

        if ($equipos->count() < 3 || $tecnicos->count() < 2) {
            $this->command->warn('No hay suficientes equipos o técnicos para generar reparaciones de prueba.');
            return;
        }

        $reparaciones = [
            [
                'equipo_id'   => $equipos[0]->id,
                'usuario_id'  => $tecnicos[0]->id,
                'descripcion' => 'Cambio de carburador y ajuste de ralentí en motosierra profesional.',
                'fecha'       => Carbon::now()->subDays(5),
                'estado'      => 'en_proceso',
            ],
            [
                'equipo_id'   => $equipos[1]->id,
                'usuario_id'  => $tecnicos[1]->id,
                'descripcion' => 'Reemplazo de correa trapezoidal y alineación de poleas en cortadora de césped.',
                'fecha'       => Carbon::now()->subDays(3),
                'estado'      => 'pendiente',
            ],
            [
                'equipo_id'   => $equipos[2]->id,
                'usuario_id'  => $tecnicos[0]->id,
                'descripcion' => 'Cambio de bujía, limpieza profunda del carburador y revisión de filtro de aire en motoguadaña industrial.',
                'fecha'       => Carbon::now()->subDays(1),
                'estado'      => 'finalizado', // <-- CORREGIDO
            ]
        ];

        foreach ($reparaciones as $data) {
            Reparacion::create($data);
        }

        $this->command->info('3 reparaciones de maquinaria creadas exitosamente!');
    }
}
