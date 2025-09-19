<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('presupuesto_tecnico', function (Blueprint $table) {
            $table->foreignId('presupuesto_id')->constrained('presupuesto')->cascadeOnDelete();
            $table->foreignId('usuario_id')->constrained('usuario')->cascadeOnDelete(); // <- cambiado
            $table->primary(['presupuesto_id', 'usuario_id']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('presupuesto_tecnico');
    }
};
