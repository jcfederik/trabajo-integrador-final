<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('presupuesto', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reparacion_id')->constrained('reparacion')->onDelete('cascade');
            $table->timestamp('fecha')->useCurrent();
            $table->decimal('monto_total', 12, 2)->nullable();
            $table->boolean('aceptado')->default(false);
        });
    }

    public function down(): void {
        Schema::dropIfExists('presupuesto');
    }
};


