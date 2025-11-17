<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reparacion extends Model
{
    use HasFactory;

    protected $table = 'reparacion';

    protected $fillable = [
        'equipo_id',
        'usuario_id',
        'descripcion',
        'fecha',
        'estado'
    ];

    public function equipo()
    {
        return $this->belongsTo(Equipo::class, 'equipo_id');
    }

    public function tecnico()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function repuestos()
    {
        return $this->belongsToMany(Repuesto::class, 'reparacion_repuesto')
                    ->withPivot('cantidad', 'costo_unitario')
                    ->withTimestamps();
    }

    public function presupuestos()
    {
        return $this->hasMany(Presupuesto::class, 'reparacion_id');
    }

    public function facturas()
    {
        return $this->hasManyThrough(Factura::class, Presupuesto::class, 'reparacion_id', 'presupuesto_id');
    }
}