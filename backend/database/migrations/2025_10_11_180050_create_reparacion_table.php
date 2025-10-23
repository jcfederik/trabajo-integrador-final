<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('reparacion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipo_id')->constrained('equipo')->onDelete('cascade');
            $table->foreignId('usuario_id')->constrained('usuario')->onDelete('cascade'); // técnico
            $table->text('descripcion');
            $table->timestamp('fecha');
            $table->string('estado', 50)->default('pendiente');
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('reparacion');
    }
};
