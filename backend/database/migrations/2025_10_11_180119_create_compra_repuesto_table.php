<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('compra_repuesto', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proveedor_id')->constrained('proveedor')->onDelete('cascade');
            $table->foreignId('repuesto_id')->constrained('repuesto')->onDelete('cascade');
            $table->string('numero_comprobante', 50)->unique();
            $table->integer('cantidad');
            $table->decimal('total', 12, 2);
            $table->string('estado', 50)->default('pendiente');
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('compra_repuesto');
    }
};
