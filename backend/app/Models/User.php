<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;
use App\Http\Controllers\AuthController;

class User extends Authenticatable implements JWTSubject
{
    public $timestamps = false;

    use HasFactory, Notifiable;

    protected $table = 'usuario';
    protected $fillable = ['nombre', 'tipo', 'password'];
    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    // Métodos JWT
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }

    public function especializaciones()
    {
        return $this->belongsToMany(Especializacion::class, 'usuario_especializacion', 'usuario_id', 'especializacion_id');
    }

    // ✅ PERMISOS DESDE AuthController
    public function hasPermission($permission)
    {
        $permissions = AuthController::getPermissionsByTipo($this->tipo);
        return in_array($permission, $permissions);
    }

    // ✅ Para frontend
    public function getPermissionsAttribute()
    {
        return AuthController::getPermissionsByTipo($this->tipo);
    }

    // ✅ Helpers
    public function isAdmin()
    {
        return $this->tipo === 'administrador';
    }

    public function isUsuario()
    {
        return $this->tipo === 'usuario';
    }

    public function isTecnico()
    {
        return $this->tipo === 'tecnico';
    }
}