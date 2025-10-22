<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Especializacion extends Model
{
    protected $table = 'especializacion';

    protected $fillable = [
        'nombre',
    ];

    public $timestamps = false;

    /** Relaciones */
    public function users()
    {
        return $this->belongsToMany(User::class, 'usuario_especializacion', 'especializacion_id', 'usuario_id');
                    //->withTimestamps();
    }
}
