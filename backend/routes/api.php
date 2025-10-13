<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\EquipoController;
use App\Http\Controllers\MedioCobroController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AdminUserController;

// Rutas públicas
Route::post('/login', [AuthController::class, 'login']);

// Rutas protegidas con JWT
Route::middleware('auth:api')->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::get('/me', [AuthController::class, 'me']);
    
    // User profile routes (usando apiResource para consistencia)
    Route::apiResource('profile', UserController::class)->only(['index', 'update']);
    
    // Tus rutas existentes (igual que antes)
    Route::apiResource('clientes', ClienteController::class);
    Route::apiResource('equipo', EquipoController::class);
    Route::apiResource('mediocobro', MedioCobroController::class);
    
    // Rutas de administrador (usando apiResource)
    Route::middleware('admin') ->group(function () {
        Route::apiResource('users', AdminUserController::class);
    });
});