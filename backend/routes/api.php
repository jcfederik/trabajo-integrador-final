<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\EquipoController;

Route::apiResource('clientes', ClienteController::class);
Route::apiResource('equipo', EquipoController::class);