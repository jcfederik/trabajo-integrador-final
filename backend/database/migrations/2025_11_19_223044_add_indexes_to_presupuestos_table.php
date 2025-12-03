<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('presupuesto', function (Blueprint $table) {
            
            // 1. Índice para búsquedas por reparación (muy frecuente)
            $table->index('reparacion_id', 'idx_presupuestos_reparacion_id');
            
            // 2. Índice para filtros por fecha (consultas históricas)
            $table->index('fecha', 'idx_presupuestos_fecha');
            
            // 3. Índice para estado aceptado/rechazado (filtros comunes)
            $table->index('aceptado', 'idx_presupuestos_aceptado');
            
            // 4. Índice para monto_total (búsquedas por rango de precio)
            $table->index('monto_total', 'idx_presupuestos_monto_total');
            
            // 🚀 ÍNDICES COMPUESTOS para consultas combinadas
            
            // 5. Para consultas: "presupuestos aceptados de una reparación"
            $table->index(['reparacion_id', 'aceptado'], 'idx_presupuestos_reparacion_aceptado');
            
            // 6. Para consultas: "presupuestos por fecha y estado"
            $table->index(['fecha', 'aceptado'], 'idx_presupuestos_fecha_aceptado');
            
            // 7. Para consultas: "presupuestos por fecha y monto"
            $table->index(['fecha', 'monto_total'], 'idx_presupuestos_fecha_monto');
            
            // 8. Para consultas: "presupuestos aceptados por rango de fecha"
            $table->index(['aceptado', 'fecha'], 'idx_presupuestos_aceptado_fecha');
        });
    }

    public function down()
    {
        Schema::table('presupuesto', function (Blueprint $table) {
            // Eliminar todos los índices creados
            $table->dropIndex('idx_presupuestos_reparacion_id');
            $table->dropIndex('idx_presupuestos_fecha');
            $table->dropIndex('idx_presupuestos_aceptado');
            $table->dropIndex('idx_presupuestos_monto_total');
            $table->dropIndex('idx_presupuestos_reparacion_aceptado');
            $table->dropIndex('idx_presupuestos_fecha_aceptado');
            $table->dropIndex('idx_presupuestos_fecha_monto');
            $table->dropIndex('idx_presupuestos_aceptado_fecha');
        });
    }
};