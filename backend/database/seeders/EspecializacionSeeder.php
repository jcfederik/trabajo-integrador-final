<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Especializacion;

class EspecializacionSeeder extends Seeder
{
    public function run(): void
    {
        $especializaciones = [
            ['nombre' => 'Motores 2T'],                // motosierras, motoguadañas
            ['nombre' => 'Motores 4T'],                // cortadoras, generadores
            ['nombre' => 'Carburación y mezcla'],      // ajuste, limpieza
            ['nombre' => 'Electricidad y encendido'],  // bobinas, bujías, chispa
            ['nombre' => 'Corte y afilado'],           // cadenas, cuchillas
            ['nombre' => 'Transmisión y embrague'],    // poleas, embragues centrífugos
            ['nombre' => 'Sistema de combustible'],    // filtros, mangueras, pérdida
            ['nombre' => 'Diagnóstico general'],       // evaluación completa del equipo
        ];

        foreach ($especializaciones as $especializacion) {
            Especializacion::create($especializacion);
        }

        $this->command->info(count($especializaciones) . ' especializaciones de maquinaria creadas exitosamente!');
    }
}
