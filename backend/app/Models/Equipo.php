<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Equipo extends Model
{
    use HasFactory;

    protected $table = 'equipo';

    protected $fillable = [
        'cliente_id',
        'descripcion',
        'marca',
        'modelo',
        'nro_serie',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function reparaciones()
    {
        return $this->hasMany(Reparacion::class, 'equipo_id');
    }

    public function presupuestos()
    {
        return $this->hasManyThrough(Presupuesto::class, Reparacion::class, 'equipo_id', 'reparacion_id');
    }

    public function facturas()
    {
        return $this->hasManyThrough(Factura::class, Presupuesto::class, 'reparacion_id', 'presupuesto_id')
                    ->via('presupuestos');
    }
}