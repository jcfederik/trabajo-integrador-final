<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('medio_cobro', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100);
            $table->timestamps(); // <-- Reemplaza la línea de created_at con esta

        });
    }

    public function down(): void {
        Schema::dropIfExists('medio_cobro');
    }
};
