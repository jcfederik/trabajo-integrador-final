<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('tecnico', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->unique()->constrained('usuario')->cascadeOnDelete();
            $table->string('nombre', 120);
        });
    }

    public function down(): void {
        Schema::dropIfExists('tecnico');
    }
};
