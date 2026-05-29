<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('proveedor_repuesto', function (Blueprint $table) {
            $table->id();

            $table->foreignId('proveedor_id')
                  ->constrained('proveedor')
                  ->onDelete('cascade');

            $table->foreignId('repuesto_id')
                  ->constrained('repuesto')
                  ->onDelete('cascade');

            // Precio actual que ese proveedor ofrece para ese repuesto
            $table->decimal('precio', 12, 2)->nullable();

            // Para activar/desactivar relación sin borrar
            $table->boolean('activo')->default(true);

            $table->timestamps();

            // Evita duplicados
            $table->unique(['proveedor_id', 'repuesto_id']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('proveedor_repuesto');
    }
};
