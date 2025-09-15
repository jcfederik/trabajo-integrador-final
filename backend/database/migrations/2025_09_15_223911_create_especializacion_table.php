<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('especializacion', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100);
        });
    }

    public function down(): void {
        Schema::dropIfExists('especializacion');
    }
};
