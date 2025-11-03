<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class Presupuesto extends Model
{
    use HasFactory;

    protected $table = 'presupuesto'; // la tabla real es singular, está bien
    public $timestamps = false;

    protected $fillable = ['reparacion_id', 'fecha', 'monto_total', 'aceptado'];

    protected $casts = [
        'fecha'       => 'datetime:Y-m-d H:i:s',
        'aceptado'    => 'boolean',
        // si usás MySQL y querés precisión fija, podés dejarlo como string:
        // 'monto_total' => 'decimal:2',
    ];

    public function reparacion()
    {
        return $this->belongsTo(Reparacion::class, 'reparacion_id');
    }
}
