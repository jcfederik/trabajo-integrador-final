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

// Rutas públicas (SOLO login)
Route::post('/login', [AuthController::class, 'login']);

// Rutas protegidas con JWT (TODAS las demás)
Route::middleware('auth:api')->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::get('/me', [AuthController::class, 'me']);
    
    // User profile routes
    Route::apiResource('profile', UserController::class)->only(['index', 'update']);
    
    // Recursos accesibles por cualquier usuario autenticado
    Route::apiResource('clientes', ClienteController::class);
    Route::apiResource('equipo', EquipoController::class);
    Route::apiResource('medios-cobro', MedioCobroController::class);
    Route::apiResource('facturas', FacturaController::class);
    Route::apiResource('reparaciones', ReparacionController::class);
    Route::apiResource('presupuesto', PresupuestoController::class);
    Route::apiResource('compra-repuesto', CompraRepuestoController::class);
    Route::apiResource('proveedor', ProveedorController::class);
    Route::apiResource('repuesto', RepuestoController::class);
    
    // Rutas SOLO para administradores
    Route::middleware('admin')->group(function () {
        Route::apiResource('users', AdminUserController::class);
    });
});