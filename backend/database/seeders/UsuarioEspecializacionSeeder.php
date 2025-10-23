<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Especializacion;
use Illuminate\Support\Facades\DB;

class UsuarioEspecializacionSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();
        $especializaciones = Especializacion::all();

        $data = [];

        // Asignar especializaciones aleatorias a usuarios
        foreach ($users as $user) {
            $especializacionesAleatorias = $especializaciones->random(rand(1, 3));
            
            foreach ($especializacionesAleatorias as $especializacion) {
                $data[] = [
                    'usuario_id' => $user->id,
                    'especializacion_id' => $especializacion->id,
                ];
            }
        }

        // Insertar directamente sin timestamps
        DB::table('usuario_especializacion')->insert($data);

        $this->command->info('Especializaciones asignadas a usuarios exitosamente!');
    }
}