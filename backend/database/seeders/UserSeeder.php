<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'nombre' => 'tecnico1',
                'tipo' => 'tecnico',
                'password' => Hash::make('tecnico123'),
            ],
            [
                'nombre' => 'tecnico2', 
                'tipo' => 'tecnico',
                'password' => Hash::make('tecnico123'),
            ],
            [
                'nombre' => 'usuario1',
                'tipo' => 'usuario',
                'password' => Hash::make('user123'),
            ]
        ];

        foreach ($users as $user) {
            User::create($user);
        }

        $this->command->info('Usuarios técnicos y normales creados exitosamente!');
    }
}
