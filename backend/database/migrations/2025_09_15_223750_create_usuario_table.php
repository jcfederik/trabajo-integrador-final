<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('usuario', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 120);
            $table->string('tipo', 40);
            $table->string('password', 255);


            $table->softDeletes(); // deleted_at
        });
    }

    public function down(): void {
        Schema::dropIfExists('usuario');
    }
};
