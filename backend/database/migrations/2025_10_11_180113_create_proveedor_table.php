<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('proveedor', function (Blueprint $table) {
            $table->id();
            $table->string('razon_social', 150);
            $table->string('cuit', 20);
            $table->string('direccion', 150)->nullable();
            $table->string('telefono', 30)->nullable();
            $table->string('email', 120)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('proveedor');
    }
};
