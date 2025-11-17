<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    use HasFactory;

    protected $table = 'cliente';

    protected $fillable = [
        'nombre',
        'email',
        'telefono',
    ];

    public function equipos()
    {
        return $this->hasMany(Equipo::class, 'cliente_id');
    }

    public function reparaciones()
    {
        return $this->hasManyThrough(Reparacion::class, Equipo::class, 'cliente_id', 'equipo_id');
    }

    public function presupuestos()
    {
        return $this->hasManyThrough(Presupuesto::class, Reparacion::class, 'equipo_id', 'reparacion_id')
                    ->via('reparaciones');
    }

    public function facturas()
    {
        return $this->hasManyThrough(Factura::class, Presupuesto::class, 'reparacion_id', 'presupuesto_id')
                    ->via('presupuestos');
    }
}