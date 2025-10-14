<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('repuesto', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100);
            $table->integer('stock')->default(0);
            $table->decimal('costo_base', 12, 2);
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('repuesto');
    }
};
