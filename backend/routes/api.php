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
    EspecializacionController,
    DetalleCobroController,
    CobroController,
    HistorialStockController,
};

// RUTAS PÚBLICAS
Route::post('/login', [AuthController::class, 'login']);

// RUTAS PROTEGIDAS CON JWT
Route::middleware(['jwt.auth'])->group(function () {

    // Rutas de autenticación
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::get('/me', [AuthController::class, 'me']);

    // Perfil de usuario autenticado
    Route::apiResource('profile', UserController::class)->only(['index', 'update']);
    
    // =============================================
    // 🔥 RUTAS DE BÚSQUEDA ESPECÍFICAS
    // =============================================
    Route::get('/reparaciones/buscar', [ReparacionController::class, 'buscar']);
    Route::get('/reparaciones/completo', [ReparacionController::class, 'completo']);
    Route::get('/presupuestos/buscar', [PresupuestoController::class, 'buscar']);
    Route::get('/presupuestos/listado-optimizado', [PresupuestoController::class, 'listadoOptimizado']);
    Route::get('/clientes/buscar', [ClienteController::class, 'buscar']);
    Route::get('/equipos/buscar', [EquipoController::class, 'buscar']);
    Route::get('/repuestos/buscar', [RepuestoController::class, 'buscar']);
    Route::get('/usuarios/buscar', [UserController::class, 'buscar']);
    Route::get('/usuario/buscar', [ClienteController::class, 'buscar']); // ¿Es necesario? Parece duplicado
    
    // =============================================
    // 📋 RUTAS DE RECURSOS PRINCIPALES
    // =============================================
    Route::apiResource('reparaciones', ReparacionController::class);
    Route::apiResource('clientes', ClienteController::class);
    Route::apiResource('equipos', EquipoController::class);
    Route::apiResource('presupuestos', PresupuestoController::class);
    Route::apiResource('repuestos', RepuestoController::class);
    Route::apiResource('facturas', FacturaController::class);
    Route::apiResource('medios-cobro', MedioCobroController::class);
    Route::apiResource('proveedores', ProveedorController::class);
    Route::apiResource('compra-repuestos', CompraRepuestoController::class);
    Route::apiResource('especializaciones', EspecializacionController::class)->only(['index', 'show']);
    Route::apiResource('cobros', CobroController::class)->only(['index', 'store', 'show']);
    Route::apiResource('detalle-cobros', DetalleCobroController::class)->only(['index', 'show']);
    
    // =============================================
    // 🔗 RUTAS ADICIONALES CON PARÁMETROS
    // =============================================
    // Reparaciones
    Route::post('/reparaciones/{reparacion}/repuestos', [ReparacionController::class, 'assignRepuesto']);
    Route::delete('/reparaciones/{reparacion}/repuestos/{pivotId}', [ReparacionController::class, 'removeRepuesto']);
    Route::get('/reparaciones/{reparacion}/repuestos', [ReparacionController::class, 'getRepuestosAsignados']);
    
    // Clientes
    Route::get('/clientes/{id}/facturas', [ClienteController::class, 'facturasPorCliente']);
    Route::get('/clientes/{id}/facturas/todas', [ClienteController::class, 'todasFacturasPorCliente']);
    
    // Facturas
    Route::get('/facturas/{id}/saldo', [FacturaController::class, 'getSaldoPendiente']);   
    Route::get('/facturas/{id}/cobros', [FacturaController::class, 'getCobrosPorFactura']);
    
    // Proveedores
    Route::get('/proveedores/{id}/repuestos', [ProveedorController::class, 'repuestos']);
    Route::post('/proveedores/{id}/repuestos', [ProveedorController::class, 'asignarRepuesto']);
    Route::put('/proveedores/{id}/repuestos/{repuestoId}', [ProveedorController::class, 'actualizarRepuesto']);
    
    // Repuestos
    Route::post('/repuestos/comprar', [RepuestoController::class, 'comprar']);
    
    // Historial
    Route::get('/historial-stock', [HistorialStockController::class, 'index']);
    
    // Usuarios
    Route::get('/usuarios', [UserController::class, 'listarUsuarios']);
    
    // =============================================
    // ✨ CREACIÓN (no requiere admin)
    // =============================================
    Route::post('/especializaciones', [EspecializacionController::class, 'store']);
    Route::post('/users/{id}/especializaciones', [AdminUserController::class, 'autoAsignarEspecializaciones']);
    
    // =============================================
    // 👑 RUTAS SOLO PARA ADMINISTRADORES
    // =============================================
    Route::middleware(['admin'])->group(function () {
        Route::put('/especializaciones/{id}', [EspecializacionController::class, 'update']);
        Route::delete('/especializaciones/{id}', [EspecializacionController::class, 'destroy']);
        
        Route::apiResource('users', AdminUserController::class);
        Route::post('/admin/users/{id}/especializaciones', [AdminUserController::class, 'asignarEspecializacionesUsuario']);
    });
});