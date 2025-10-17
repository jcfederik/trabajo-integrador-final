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
            ['nombre' => 'Hardware'],
            ['nombre' => 'Software'],
            ['nombre' => 'Redes'],
            ['nombre' => 'Electrónica'],
            ['nombre' => 'Impresoras'],
        ];

        foreach ($especializaciones as $especializacion) {
            Especializacion::create($especializacion);
        }

        $this->command->info('5 especializaciones creadas exitosamente!');
    }
}