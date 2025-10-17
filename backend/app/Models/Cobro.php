<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cobro extends Model
{
    use HasFactory;

    protected $table = 'cobro';

    protected $fillable = [
        'presupuesto_id',
        'monto',
        'fecha',
    ];

    // Relaciones
    public function presupuesto()
    {
        return $this->belongsTo(Presupuesto::class, 'presupuesto_id');
    }

    public function detalles()
    {
        return $this->hasMany(DetalleCobro::class, 'cobro_id');
    }
}
