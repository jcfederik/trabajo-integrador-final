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

        $reparaciones = [
            [
                'equipo_id' => $equipos[0]->id,
                'usuario_id' => $tecnicos[0]->id,
                'descripcion' => 'Cambio de pantalla rota',
                'fecha' => Carbon::now()->subDays(5),
                'estado' => 'en_proceso',
            ],
            [
                'equipo_id' => $equipos[1]->id,
                'usuario_id' => $tecnicos[1]->id,
                'descripcion' => 'Reparación de fuente de poder',
                'fecha' => Carbon::now()->subDays(3),
                'estado' => 'pendiente',
            ],
            [
                'equipo_id' => $equipos[2]->id,
                'usuario_id' => $tecnicos[0]->id,
                'descripcion' => 'Limpieza interna y cambio de pasta térmica',
                'fecha' => Carbon::now()->subDays(1),
                'estado' => 'completado',
            ]
        ];

        foreach ($reparaciones as $reparacion) {
            Reparacion::create($reparacion);
        }

        $this->command->info('3 reparaciones de prueba creadas exitosamente!');
    }
}