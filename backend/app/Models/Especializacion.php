<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Especializacion extends Model
{
    protected $table = 'especializacion';

    protected $fillable = [
        'nombre',
    ];

    /** Relaciones */
    public function usuarios()
    {
        return $this->belongsToMany(Usuario::class, 'usuario_especializacion', 'especializacion_id', 'usuario_id')
                    ->withTimestamps();
    }
}
