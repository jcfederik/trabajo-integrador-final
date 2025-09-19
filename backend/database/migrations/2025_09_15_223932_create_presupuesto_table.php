<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('presupuesto', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cliente_id')->constrained('cliente')->cascadeOnDelete();
            $table->foreignId('equipo_id')->constrained('equipo')->cascadeOnDelete();
            $table->foreignId('usuario_id')->constrained('usuario')->cascadeOnDelete(); // tecnico que realiza el presupuesto
            $table->timestamp('fecha')->useCurrent();
            $table->decimal('monto_total', 12, 2)->nullable();
            $table->boolean('aceptado')->default(false);
        });
    }

    public function down(): void {
        Schema::dropIfExists('presupuesto');
    }
};


