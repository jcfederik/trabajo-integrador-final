<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            EspecializacionSeeder::class,
            UserSeeder::class, // <-- NUEVO: debe ir ANTES de UsuarioEspecializacionSeeder
            ClienteSeeder::class,
            ProveedorSeeder::class,
            EquipoSeeder::class,
            RepuestoSeeder::class,
            MedioCobroSeeder::class,
            UsuarioEspecializacionSeeder::class,
            ReparacionSeeder::class,
            ReparacionRepuestoSeeder::class,
            PresupuestoSeeder::class,
            CompraRepuestoSeeder::class,
            // CobroSeeder::class, // Depende de Presupuesto
            // DetalleCobroSeeder::class, // Depende de Cobro y MedioCobro
            // FacturaSeeder::class, // Depende de Presupuesto
        ]);
    }
}