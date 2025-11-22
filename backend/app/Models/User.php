<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

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

    // Métodos requeridos por JWT
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

    // ✅ NUEVO: Sistema de permisos (CAMBIÉ EL NOMBRE DEL MÉTODO)
    public function getPermissionsAttribute()
    {
        $permissions = [
            'administrador' => [
                'users.manage',
                'clients.manage',
                'equipos.manage',
                'reparaciones.manage',
                'facturas.manage',
                'cobros.manage',
                'proveedores.manage',
                'repuestos.manage',
                'presupuestos.manage',
                'especializaciones.manage',
                'reports.view',
                'dashboard.view'
            ],
            'usuario' => [ // Secretarios/Administrativos
                'clients.view',
                'clients.create',
                'clients.edit',
                'equipos.view',
                'equipos.create',
                'reparaciones.view',
                'reparaciones.create',
                'facturas.view',
                'facturas.create',
                'facturas.edit',
                'cobros.view',
                'cobros.create',
                'presupuestos.view',
                'presupuestos.create',
                'dashboard.view'
            ],
            'tecnico' => [ // Técnicos reparadores
                'reparaciones.view',
                'reparaciones.update',
                'reparaciones.create',
                'equipos.view',
                'equipos.create',
                'repuestos.view',
                'especializaciones.view',
                'especializaciones.manage',
                'especializaciones.create', // ✅ AGREGAR: Permiso para crear
                'especializaciones.self_assign', // ✅ AGREGAR: Permiso para auto-asignarse
                'dashboard.view'
            ]
        ];

        return $permissions[$this->tipo] ?? [];
    }

    // ✅ NUEVO: Verificar permisos (CAMBIÉ EL NOMBRE)
    public function hasPermission($permission)
    {
        return in_array($permission, $this->permissions);
    }

    // ✅ NUEVO: Métodos helper
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
