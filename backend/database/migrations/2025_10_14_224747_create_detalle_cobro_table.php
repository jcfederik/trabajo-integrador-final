<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('detalle_cobro', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cobro_id')->constrained('cobro')->cascadeOnDelete();
            $table->foreignId('medio_cobro_id')->constrained('medio_cobro')->cascadeOnDelete();
            $table->decimal('monto_pagado', 12, 2);
            $table->timestamp('fecha')->useCurrent();
        });
    }

    public function down(): void {
        Schema::dropIfExists('detalle_cobro');
    }
};
