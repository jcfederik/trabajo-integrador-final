<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cobro extends Model
{
    use HasFactory;

    protected $table = 'cobro';

    public $timestamps = false; 

    protected $fillable = [
        'factura_id',
        'monto',
        'fecha',
    ];
    // Relaciones
    public function factura() // ✅ Nueva relación
    {
        return $this->belongsTo(Factura::class, 'factura_id');
    }

    public function detalles()
    {
        return $this->hasMany(DetalleCobro::class, 'cobro_id');
    }
}
