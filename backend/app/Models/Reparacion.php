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

    /** Relaciones */
    public function equipo()
    {
        return $this->belongsTo(Equipo::class, 'equipo_id');
    }

    public function tecnico()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function repuestos()
    {
        return $this->belongsToMany(Repuesto::class, 'reparacion_repuesto')
                    ->withPivot('cantidad', 'costo_unitario')
                    ->withTimestamps();
    }
}
