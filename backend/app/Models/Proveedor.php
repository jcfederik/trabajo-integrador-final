<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Proveedor extends Model
{
    use HasFactory;

    protected $table = 'proveedor';

    protected $fillable = [
        'razon_social',
        'cuit',
        'direccion',
        'telefono',
        'email'
    ];

    /** Relaciones */
    public function compras()
    {
        return $this->hasMany(CompraRepuesto::class, 'proveedor_id');
    }




     public function repuestos()
    {
        return $this->belongsToMany(Repuesto::class, 'proveedor_repuesto')
                    ->withPivot('precio', 'activo');
    }


    
}
