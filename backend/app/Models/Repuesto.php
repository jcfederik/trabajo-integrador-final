<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Repuesto extends Model
{
    use HasFactory;

    protected $table = 'repuesto';

    protected $fillable = [
        'nombre',
        'stock',
        'costo_base'
    ];

    /** Relaciones */
    public function reparaciones()
    {
        return $this->belongsToMany(Reparacion::class, 'reparacion_repuesto', 'repuesto_id', 'reparacion_id')
                    ->withPivot('id', 'cantidad', 'costo_unitario', 'created_at', 'updated_at');
    }

    public function compras()
    {
        return $this->hasMany(CompraRepuesto::class, 'repuesto_id');
    }
}
