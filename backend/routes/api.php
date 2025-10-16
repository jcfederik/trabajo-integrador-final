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
    RepuestoController
};


// Rutas públicas
Route::post('/login', [AuthController::class, 'login']);
Route::apiResource('clientes', ClienteController::class);
Route::apiResource('equipo', EquipoController::class);
Route::apiResource('medios-cobro', MedioCobroController::class);
Route::apiResource('facturas', FacturaController::class);
Route::apiResource('reparaciones', ReparacionController::class);
Route::apiResource('presupuesto', PresupuestoController::class);
Route::apiResource('compra-repuesto', CompraRepuestoController::class);
Route::apiResource('proveedor', ProveedorController::class);
Route::apiResource('repuesto', RepuestoController::class);
// Rutas protegidas con JWT
Route::middleware('auth:api')->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::get('/me', [AuthController::class, 'me']);
    
    // User profile routes (usando apiResource para consistencia)
    Route::apiResource('profile', UserController::class)->only(['index', 'update']);
    Route::apiResource('presupuesto', PresupuestoController::class);
    // Rutas de administrador (usando apiResource)
    Route::middleware('admin') ->group(function () {
        Route::apiResource('users', AdminUserController::class);
    });
});