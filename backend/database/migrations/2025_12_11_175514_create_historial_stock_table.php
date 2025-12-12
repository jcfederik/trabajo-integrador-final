<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('historial_stock', function (Blueprint $table) {
            $table->id();

            // Repuesto afectado
            $table->foreignId('repuesto_id')
                  ->constrained('repuesto')
                  ->onDelete('cascade');

            // Tipo de movimiento
            $table->string('tipo_mov', 50);

            // Cantidad modificada
            $table->integer('cantidad');

            // Estado del stock antes y después
            $table->integer('stock_anterior');
            $table->integer('stock_nuevo');

            // Relación polimórfica
            $table->unsignedBigInteger('origen_id')->nullable();
            $table->string('origen_tipo', 100)->nullable();

            // Usuario que realizó el movimiento
            $table->foreignId('usuario_id')          
                  ->nullable()
                  ->constrained('usuario')          
                  ->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('historial_stock');
    }
};
