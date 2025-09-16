<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('cliente', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 120);
            $table->string('telefono', 30)->nullable();
            $table->string('email', 120)->nullable();
            $table->timestamps(); // <-- Reemplaza la línea de created_at con esta
        });
    }

    public function down(): void {
        Schema::dropIfExists('cliente');
    }
};
