<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('cobro', function (Blueprint $table) {
            $table->id();
            $table->foreignId('presupuesto_id')->constrained('presupuesto')->cascadeOnDelete();
            $table->decimal('monto', 12, 2);
            $table->timestamp('fecha')->useCurrent();
        });
    }

    public function down(): void {
        Schema::dropIfExists('cobro');
    }
};
