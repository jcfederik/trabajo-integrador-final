<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Presupuesto extends Model
{
    use HasFactory;

    protected $table = 'presupuesto';
    public $timestamps = false;

    protected $fillable = ['reparacion_id', 'fecha', 'monto_total', 'aceptado'];

    protected $casts = [
        'fecha'       => 'datetime:Y-m-d H:i:s',
        'aceptado'    => 'boolean',
    ];

    public function reparacion()
    {
        return $this->belongsTo(Reparacion::class, 'reparacion_id');
    }

    public function facturas()
    {
        return $this->hasMany(Factura::class, 'presupuesto_id');
    }

        public function tecnico()
    {
        // Relación corregida - apunta al modelo User que usa tabla 'usuario'
        return $this->belongsTo(User::class, 'usuario_id');
    }
}