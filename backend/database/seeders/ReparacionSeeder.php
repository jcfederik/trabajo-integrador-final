<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
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
                'equipo_id' => $equipos[0]->id,
                'usuario_id' => $tecnicos[0]->id,
                'descripcion' => 'Cambio de carburador y ajuste de ralentí en motosierra',
                'fecha' => Carbon::now()->subDays(5),
                'estado' => 'en_proceso',
            ],
            [
                'equipo_id' => $equipos[1]->id,
                'usuario_id' => $tecnicos[1]->id,
                'descripcion' => 'Reemplazo de correa trapezoidal y alineación en cortadora de césped',
                'fecha' => Carbon::now()->subDays(3),
                'estado' => 'pendiente',
            ],
            [
                'equipo_id' => $equipos[2]->id,
                'usuario_id' => $tecnicos[0]->id,
                'descripcion' => 'Cambio de bujía y limpieza de filtro de aire en motoguadaña',
                'fecha' => Carbon::now()->subDays(1),
                'estado' => 'completado',
            ]
        ];

        foreach ($reparaciones as $reparacion) {
            Reparacion::create($reparacion);
        }

        $this->command->info('3 reparaciones de maquinaria creadas exitosamente!');
    }
}
