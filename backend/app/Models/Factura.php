<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Factura extends Model
{
    use HasFactory;

    protected $table = 'factura';
    public $timestamps = false;

    protected $fillable = [
        'presupuesto_id',
        'numero',
        'letra',
        'fecha',
        'monto_total',
        'detalle',
    ];

    protected $casts = [
        'fecha'       => 'datetime:Y-m-d H:i:s',
        'monto_total' => 'decimal:2',
    ];

    public function presupuesto()
    {
        return $this->belongsTo(Presupuesto::class, 'presupuesto_id');
    }

    public function cliente()
    {
        return $this->hasOneThrough(
            Cliente::class,
            Presupuesto::class,
            'id',
            'id',
            'presupuesto_id',
            'reparacion_id'
        )->via('presupuesto');
    }

    public function cobros()
    {
        return $this->hasMany(Cobro::class, 'factura_id');
    }

    public function getSaldoPendienteAttribute(): float
    {
        $montoCobrado = $this->cobros()->sum('monto');
        return $this->monto_total - $montoCobrado;
    }
}
