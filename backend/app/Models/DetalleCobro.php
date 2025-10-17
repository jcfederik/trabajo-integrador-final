<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DetalleCobro extends Model
{
    use HasFactory;

    protected $table = 'detalle_cobro';

    protected $fillable = [
        'cobro_id',
        'medio_cobro_id',
        'monto_pagado',
        'fecha',
    ];

    // Relaciones
    public function cobro()
    {
        return $this->belongsTo(Cobro::class, 'cobro_id');
    }

    public function medioCobro()
    {
        return $this->belongsTo(MedioCobro::class, 'medio_cobro_id');
    }
}
