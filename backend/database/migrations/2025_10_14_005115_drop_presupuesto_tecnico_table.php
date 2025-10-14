<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::dropIfExists('presupuesto_tecnico');
    }

    public function down(): void
    {
        Schema::create('presupuesto_tecnico', function (Blueprint $table) {
            $table->id();
            // Si querés, podés dejar una definición básica por si hacés rollback
            $table->unsignedBigInteger('presupuesto_id')->nullable();
            $table->unsignedBigInteger('usuario_id')->nullable();
            $table->timestamps();
        });
    }
};
