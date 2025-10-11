<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReparacionRepuesto extends Model
{
    use HasFactory;

    protected $table = 'reparacion_repuesto';

    protected $fillable = [
        'reparacion_id',
        'repuesto_id',
        'cantidad',
        'costo_unitario'
    ];

    /** Relaciones */
    public function reparacion()
    {
        return $this->belongsTo(Reparacion::class, 'reparacion_id');
    }

    public function repuesto()
    {
        return $this->belongsTo(Repuesto::class, 'repuesto_id');
    }
}
