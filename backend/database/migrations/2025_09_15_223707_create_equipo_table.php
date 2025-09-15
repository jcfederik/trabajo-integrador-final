<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('equipo', function (Blueprint $table) {
            $table->id();
            $table->string('descripcion', 200);
            $table->string('marca', 100)->nullable();
            $table->string('modelo', 100)->nullable();
            $table->string('nro_serie', 100)->nullable();
        });
    }

    public function down(): void {
        Schema::dropIfExists('equipo');
    }
};
