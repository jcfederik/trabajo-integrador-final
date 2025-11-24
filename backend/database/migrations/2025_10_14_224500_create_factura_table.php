<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('factura', function (Blueprint $table) {
            $table->id();
            $table->foreignId('presupuesto_id')->constrained('presupuesto')->onDelete('cascade');
            $table->string('numero')->unique();
            $table->char('letra', 1);
            $table->timestamp('fecha');
            $table->decimal('monto_total', 12, 2);
            $table->text('detalle')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('factura');
    }
};
