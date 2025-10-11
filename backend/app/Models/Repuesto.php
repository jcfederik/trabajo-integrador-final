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
        return $this->belongsToMany(Reparacion::class, 'reparacion_repuesto')
                    ->withPivot('cantidad', 'costo_unitario')
                    ->withTimestamps();
    }

    public function compras()
    {
        return $this->hasMany(CompraRepuesto::class, 'repuesto_id');
    }
}
