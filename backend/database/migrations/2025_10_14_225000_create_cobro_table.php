<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // En la migración de cobro
        Schema::create('cobro', function (Blueprint $table) {
            $table->id();
            // ✅ Corregido: Ahora apunta a la Factura
            $table->foreignId('factura_id')->constrained('factura')->cascadeOnDelete();
            $table->decimal('monto', 12, 2);
            $table->timestamp('fecha')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cobro');
    }
};
