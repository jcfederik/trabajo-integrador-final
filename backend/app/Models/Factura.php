<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Factura extends Model
{
    use HasFactory;

    protected $table = 'factura';

    protected $fillable = [
        'presupuesto_id',
        'numero',
        'letra',
        'fecha',
        'monto_total',
        'detalle'
    ];

    /** Relaciones */
    public function presupuesto()
    {
        return $this->belongsTo(Presupuesto::class, 'presupuesto_id');
    }
}
