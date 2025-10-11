<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('reparacion_repuesto', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reparacion_id')->constrained('reparacion')->onDelete('cascade');
            $table->foreignId('repuesto_id')->constrained('repuesto')->onDelete('cascade');
            $table->integer('cantidad')->default(1);
            $table->decimal('costo_unitario', 12, 2);
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('reparacion_repuesto');
    }
};
