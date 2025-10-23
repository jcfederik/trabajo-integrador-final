<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Presupuesto extends Model
{
    //
    
    protected $table = 'presupuesto';
    protected $fillable = [
        'reparacion_id',
        'fecha',
        'monto_total',
        'aceptado'
    ];

    public $timestamps = false;

        public function reparacion()
    {
        return $this->belongsTo(Reparacion::class, 'reparacion_id');
    }

    use HasFactory;
}
