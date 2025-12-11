<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\HistorialStock;

class HistorialStockSeeder extends Seeder
{
    public function run(): void
    {
        HistorialStock::create([
            'repuesto_id' => 1,
            'tipo_mov' => 'INICIAL',
            'cantidad' => 10,
            'stock_anterior' => 0,
            'stock_nuevo' => 10,
            'origen_id' => null,
            'origen_tipo' => null,
            'user_id' => 1
        ]);
    }
}
