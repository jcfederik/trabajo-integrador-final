<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([

            // ============================================
            // 🔐 USUARIOS Y PERMISOS
            // ============================================
            AdminUserSeeder::class,
            UserSeeder::class,
            EspecializacionSeeder::class,
            UsuarioEspecializacionSeeder::class,

            // ============================================
            // 📁 CLIENTES Y EQUIPOS
            // ============================================
            ClienteSeeder::class,
            EquipoSeeder::class,

            // ============================================
            // 📦 REPUESTOS Y PROVEEDORES
            // ============================================
            ProveedorSeeder::class,
            RepuestoSeeder::class,

            // Pivot proveedor ↔ repuestos (antes de compras)
            ProveedorRepuestoSeeder::class,

            // ============================================
            // 💳 MEDIOS DE COBRO
            // ============================================
            MedioCobroSeeder::class,

            // ============================================
            // 🛠 REPARACIONES Y ASIGNACIONES DE REPUESTOS
            // ============================================
            ReparacionSeeder::class,
            ReparacionRepuestoSeeder::class,

            // ============================================
            // 🧾 PRESUPUESTOS
            // ============================================
            PresupuestoSeeder::class,

            // ============================================
            // 🛒 COMPRAS → actualizan stock + historial
            // ============================================
            CompraRepuestoSeeder::class,

            // ============================================
            // 🧮 HISTORIAL DE STOCK 
            // ============================================
            HistorialStockSeeder::class, // opcional

            // ============================================
            // 💸 COBROS Y FACTURACIÓN 
            // ============================================
            // CobroSeeder::class,
            // DetalleCobroSeeder::class,
            // FacturaSeeder::class,
        ]);
    }
}
