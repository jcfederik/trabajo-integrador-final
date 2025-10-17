<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Usuario;
use App\Models\Especializacion;

class UsuarioEspecializacionSeeder extends Seeder
{
    public function run(): void
    {
        $usuarios = Usuario::all();
        $especializaciones = Especializacion::all();

        // Asignar especializaciones aleatorias a usuarios
        foreach ($usuarios as $usuario) {
            $especializacionesAleatorias = $especializaciones->random(rand(1, 3));
            $usuario->especializaciones()->attach($especializacionesAleatorias);
        }

        $this->command->info('Especializaciones asignadas a usuarios exitosamente!');
    }
}