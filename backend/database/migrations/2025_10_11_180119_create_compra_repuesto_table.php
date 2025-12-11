<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('compra_repuesto', function (Blueprint $table) {

            $table->id();

            // Relación con proveedor
            $table->foreignId('proveedor_id')
                ->constrained('proveedor')
                ->onDelete('cascade');

            // Relación con repuesto
            $table->foreignId('repuesto_id')
                ->constrained('repuesto')
                ->onDelete('cascade');

            // Usuario que realizó la compra
            $table->foreignId('usuario_id')
                ->nullable()
                ->constrained('usuario')
                ->nullOnDelete();

            // Datos de compra
            $table->string('numero_comprobante', 50)->unique();
            $table->integer('cantidad');

            // Nuevas columnas requeridas por el controller
            $table->decimal('precio_unitario', 10, 2)->nullable();
            $table->decimal('total', 10, 2);

            // Estado de la compra
            $table->string('estado', 50)->default('procesado');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('compra_repuesto');
    }
};
