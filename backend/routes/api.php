<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
    ClienteController,
    EquipoController,
    MedioCobroController,
    AuthController,
    UserController,
    AdminUserController,
    FacturaController,
    ReparacionController,
    PresupuestoController,
    CompraRepuestoController,
    ProveedorController,
    RepuestoController,
    EspecializacionController
};

/*
|--------------------------------------------------------------------------
| RUTAS PÚBLICAS
|--------------------------------------------------------------------------
| Solo accesibles sin autenticación JWT
*/
Route::post('/login', [AuthController::class, 'login']);


/*
|--------------------------------------------------------------------------
| RUTAS PROTEGIDAS CON JWT
|--------------------------------------------------------------------------
| Solo accesibles con un token válido
*/
Route::middleware(['jwt.auth'])->group(function () {

    // 🔹 Rutas de autenticación
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::get('/me', [AuthController::class, 'me']);

    // 🔹 Perfil de usuario autenticado
    Route::apiResource('profile', UserController::class)->only(['index', 'update']);

    // 🔹 Recursos accesibles por cualquier usuario autenticado
    Route::apiResource('clientes', ClienteController::class);
    Route::apiResource('equipos', EquipoController::class);
    Route::apiResource('medios-cobro', MedioCobroController::class);
    Route::apiResource('facturas', FacturaController::class);
    Route::apiResource('reparaciones', ReparacionController::class);
    Route::apiResource('presupuestos', PresupuestoController::class);
    Route::apiResource('compras-repuestos', CompraRepuestoController::class);
    Route::apiResource('proveedores', ProveedorController::class);
    Route::apiResource('repuestos', RepuestoController::class);
    Route::apiResource('especializaciones', EspecializacionController::class)
        ->only(['index', 'show']); // 👈 todos pueden ver, no crear


    /*
    |--------------------------------------------------------------------------
    | RUTAS SOLO PARA ADMINISTRADORES
    |--------------------------------------------------------------------------
    | Requieren token JWT válido y rol administrador
    */
    Route::middleware(['admin'])->group(function () {
        Route::apiResource('users', AdminUserController::class);
        Route::post('especializaciones', [EspecializacionController::class, 'store']);
        Route::put('especializaciones/{id}', [EspecializacionController::class, 'update']);
        Route::delete('especializaciones/{id}', [EspecializacionController::class, 'destroy']);
    });
});
