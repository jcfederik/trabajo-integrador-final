<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\EquipoController;
use App\Http\Controllers\MedioCobroController;

Route::apiResource('clientes', ClienteController::class);
Route::apiResource('equipo', EquipoController::class);
Route::apiResource('mediocobro', MedioCobroController::class);
Route::apiResource('facturas', FacturaController::class);

