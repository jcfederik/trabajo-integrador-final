<?php
// app/Models/Factura.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Factura extends Model
{
    use HasFactory;

    // 👇 tu tabla real es singular
    protected $table = 'factura';

    public $timestamps = false;

    protected $fillable = [
        'presupuesto_id',
        'numero',
        'letra',
        'fecha',
        'monto_total',
        'detalle',
    ];

    protected $casts = [
        'fecha'       => 'datetime:Y-m-d H:i:s',
        'monto_total' => 'decimal:2',
    ];

    public function presupuesto()
    {
        return $this->belongsTo(\App\Models\Presupuesto::class, 'presupuesto_id');
    }
}
