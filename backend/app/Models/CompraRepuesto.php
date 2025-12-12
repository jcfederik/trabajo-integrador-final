<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompraRepuesto extends Model
{
    use HasFactory;

    protected $table = 'compra_repuesto';

    protected $fillable = [
        'proveedor_id',
        'repuesto_id',
        'usuario_id',              // ← AGREGADO
        'numero_comprobante',
        'cantidad',
        'precio_unitario',      // ← AGREGADO
        'total',
        'estado'
    ];

    /** Relaciones */
    public function proveedor()
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }

    public function repuesto()
    {
        return $this->belongsTo(Repuesto::class, 'repuesto_id');
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
