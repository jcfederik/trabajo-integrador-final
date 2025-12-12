<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HistorialStock extends Model
{
    use HasFactory;

    protected $table = 'historial_stock';

    protected $fillable = [
        'repuesto_id',
        'tipo_mov',
        'cantidad',
        'stock_anterior',
        'stock_nuevo',
        'origen_id',
        'origen_tipo',
        'usuario_id',
    ];

    public function repuesto()
    {
        return $this->belongsTo(Repuesto::class, 'repuesto_id');
    }
}
