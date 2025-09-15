<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('usuario_especializacion', function (Blueprint $table) {
            $table->foreignId('usuario_id')->constrained('usuario')->cascadeOnDelete();
            $table->foreignId('especializacion_id')->constrained('especializacion')->cascadeOnDelete();
            $table->primary(['usuario_id', 'especializacion_id']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('usuario_especializacion');
    }
};
