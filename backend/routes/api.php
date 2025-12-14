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
    
    // Rutas adicionales completas
    Route::get('/reparaciones/completo', [ReparacionController::class, 'completo']);
    Route::get('/presupuestos/listado-optimizado', [PresupuestoController::class, 'listadoOptimizado']);

    // Búsquedas
    Route::get('/usuario/buscar', [ClienteController::class, 'buscar']);
    Route::get('/usuarios', [UserController::class, 'listarUsuarios']);
    Route::get('/clientes/buscar', [ClienteController::class, 'buscar']);
    Route::get('/usuarios/buscar', [UserController::class, 'buscar']);
    
    // CLIENTES
    Route::apiResource('clientes', ClienteController::class);
    Route::get('/clientes/{id}/facturas', [ClienteController::class, 'facturasPorCliente']);
    Route::get('/clientes/{id}/facturas/todas', [ClienteController::class, 'todasFacturasPorCliente']);
    
    // EQUIPOS
    Route::apiResource('equipos', EquipoController::class);
    Route::get('/equipos/buscar', [EquipoController::class, 'buscar']);
    
    // MEDIOS DE COBRO
    Route::apiResource('medios-cobro', MedioCobroController::class);
    
    // FACTURAS
    Route::apiResource('facturas', FacturaController::class);
    Route::get('/facturas/{id}/cobros', [FacturaController::class, 'getCobrosPorFactura']);
    Route::get('/facturas/{id}/saldo', [FacturaController::class, 'getSaldoPendiente']);
    
    // REPARACIONES
    Route::apiResource('reparaciones', ReparacionController::class);
    Route::get('/reparaciones/buscar', [ReparacionController::class, 'buscar']);
    Route::get('/reparaciones/completo', [ReparacionController::class, 'completo']);
    Route::post('/reparaciones/{reparacion}/repuestos', [ReparacionController::class, 'assignRepuesto']);
    Route::delete('/reparaciones/{reparacion}/repuestos/{pivotId}', [ReparacionController::class, 'removeRepuesto']);
    Route::get('/reparaciones/{reparacion}/repuestos', [ReparacionController::class, 'getRepuestosAsignados']);
    
    // PRESUPUESTOS
    Route::apiResource('presupuestos', PresupuestoController::class);
    Route::get('/presupuestos/buscar', [PresupuestoController::class, 'buscar']);
    
    // COMPRA REPUESTOS
    Route::apiResource('compra-repuestos', CompraRepuestoController::class);

    // PROVEEDORES
    Route::apiResource('proveedores', ProveedorController::class);
    Route::get('/proveedores/{id}/repuestos', [ProveedorController::class, 'repuestos']);
    Route::post('/proveedores/{id}/repuestos', [ProveedorController::class, 'asignarRepuesto']);
    Route::put('/proveedores/{id}/repuestos/{repuestoId}', [ProveedorController::class, 'actualizarRepuesto']);

    // REPUESTOS
    Route::apiResource('repuestos', RepuestoController::class);
    Route::get('/repuestos/buscar', [RepuestoController::class, 'buscar']);
    Route::post('/repuestos/comprar', [RepuestoController::class, 'comprar']);
    
    // ✅ HISTORIAL STOCK - SOLO ADMIN (PROTEGIDO EN RUTA)
    Route::middleware(['permission:historial-stock.view'])->get('/historial-stock', 
        [HistorialStockController::class, 'index']
    );
    
    // COBROS
    Route::apiResource('cobros', CobroController::class)->only(['index', 'store', 'show']);
    Route::apiResource('detalle-cobros', DetalleCobroController::class)->only(['index', 'show']);
    
    // ESPECIALIZACIONES
    Route::apiResource('especializaciones', EspecializacionController::class)->only(['index', 'show']);
    Route::post('/especializaciones', [EspecializacionController::class, 'store']);
    Route::post('/users/{id}/especializaciones', [AdminUserController::class, 'autoAsignarEspecializaciones']);
    
    // ✅ RUTAS SOLO ADMIN (PROTEGIDAS EN RUTA)
    Route::middleware(['permission:users.manage'])->group(function () {
        Route::put('/especializaciones/{id}', [EspecializacionController::class, 'update']);
        Route::delete('/especializaciones/{id}', [EspecializacionController::class, 'destroy']);
        Route::apiResource('users', AdminUserController::class);
        Route::post('/admin/users/{id}/especializaciones', [AdminUserController::class, 'asignarEspecializacionesUsuario']);
    });
});