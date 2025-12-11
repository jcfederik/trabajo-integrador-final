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
    //Route::post('/profile/especializaciones', [AdminUserController::class, 'asignarEspecializaciones']);
    
    // Rutas adicionales completas
    Route::get('/reparaciones/completo', [ReparacionController::class, 'completo']);
    Route::get('/presupuestos/listado-optimizado', [PresupuestoController::class, 'listadoOptimizado']);

    // Recursos accesibles por cualquier usuario autenticado
    Route::get('/usuario/buscar', [ClienteController::class, 'buscar']);
    Route::get('/usuarios', [UserController::class, 'listarUsuarios']);
    Route::get('/clientes/buscar', [ClienteController::class, 'buscar']);
    Route::get('/clientes/{id}/facturas', [ClienteController::class, 'facturasPorCliente']);
    Route::get('/clientes/{id}/facturas/todas', [ClienteController::class, 'todasFacturasPorCliente']);
    Route::get('/facturas/{id}/saldo', [FacturaController::class, 'getSaldoPendiente']);   
    Route::get('/facturas/{id}/cobros', [FacturaController::class, 'getCobrosPorFactura']);  
    Route::apiResource('clientes', ClienteController::class);
    Route::get('/usuarios/buscar', [UserController::class, 'buscar']);
    
    Route::apiResource('clientes', ClienteController::class);
    Route::get('/clientes/buscar', [ClienteController::class, 'buscar']);
    Route::get('/clientes/{id}/facturas', [ClienteController::class, 'facturasPorCliente']);
    Route::get('/clientes/{id}/facturas/todas', [ClienteController::class, 'todasFacturasPorCliente']);    

    Route::apiResource('equipos', EquipoController::class);
    Route::get('/equipos/buscar', [EquipoController::class, 'buscar']);
    
    Route::apiResource('medios-cobro', MedioCobroController::class);
    Route::apiResource('facturas', FacturaController::class);
    Route::get('/facturas/{id}/cobros', [FacturaController::class, 'getCobrosPorFactura']);
    Route::get('/facturas/{id}/saldo', [FacturaController::class, 'getSaldoPendiente']);
    
    Route::apiResource('reparaciones', ReparacionController::class);
    Route::get('/reparaciones/buscar', [ReparacionController::class, 'buscar']);
    Route::get('/reparaciones/completo', [ReparacionController::class, 'completo']);
    Route::post('/reparaciones/{reparacion}/repuestos', [ReparacionController::class, 'assignRepuesto']);
    Route::delete('/reparaciones/{reparacion}/repuestos/{pivotId}', [ReparacionController::class, 'removeRepuesto']);
    Route::get('/reparaciones/{reparacion}/repuestos', [ReparacionController::class, 'getRepuestosAsignados']);
    
    Route::apiResource('presupuestos', PresupuestoController::class);
    Route::get('/presupuestos/buscar', [PresupuestoController::class, 'buscar']);
    
    Route::apiResource('compra-repuestos', CompraRepuestoController::class);


    Route::apiResource('proveedores', ProveedorController::class);
    Route::get('/proveedores/{id}/repuestos', [ProveedorController::class, 'repuestos']);
    Route::post('/proveedores/{id}/repuestos', [ProveedorController::class, 'asignarRepuesto']);
    Route::put('/proveedores/{id}/repuestos/{repuestoId}', [ProveedorController::class, 'actualizarRepuesto']);

    Route::apiResource('repuestos', RepuestoController::class);
    Route::get('/historial-stock', [HistorialStockController::class, 'index']);
    




    // ----------------------------------------------------
    // ✅ RUTAS DE COBRO AÑADIDAS
    // ----------------------------------------------------
    Route::apiResource('cobros', CobroController::class)->only(['index', 'store', 'show']);
    Route::apiResource('detalle-cobros', DetalleCobroController::class)->only(['index', 'show']);
    
    // Las rutas de 'detalle-cobros' ya estaban, pero aquí se consolidan por tema.
    // ----------------------------------------------------

    // ESPECIALIZACIONES - Lectura para todos
    Route::apiResource('especializaciones', EspecializacionController::class)->only(['index', 'show']);
    
    // ✅ CREACIÓN de especializaciones para técnicos y admin
    Route::post('/especializaciones', [EspecializacionController::class, 'store']);
    
    // ✅ AUTO-ASIGNACIÓN para técnicos
    Route::post('/users/{id}/especializaciones', [AdminUserController::class, 'autoAsignarEspecializaciones']);
    
    // ✅ RUTAS SOLO PARA ADMINISTRADORES
    Route::middleware(['admin'])->group(function () {
        // Edición y eliminación de especializaciones solo para admin
        Route::put('/especializaciones/{id}', [EspecializacionController::class, 'update']);
        Route::delete('/especializaciones/{id}', [EspecializacionController::class, 'destroy']);
        
        // Gestión completa de usuarios
        Route::apiResource('users', AdminUserController::class);
        Route::post('/admin/users/{id}/especializaciones', [AdminUserController::class, 'asignarEspecializacionesUsuario']);
    });
});