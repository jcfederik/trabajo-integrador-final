<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;
use App\Http\Controllers\AuthController;

class CheckPermission
{
    public function handle(Request $request, Closure $next, $permission): Response
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
            
            if (!$user) {
                return response()->json(['error' => 'Usuario no autenticado'], 401);
            }
            
            // ✅ Verificar permiso usando AuthController
            $permissions = AuthController::getPermissionsByTipo($user->tipo);
            
            if (!in_array($permission, $permissions)) {
                return response()->json([
                    'error' => 'No tienes permisos para esta acción'
                ], 403);
            }

            return $next($request);
            
        } catch (\Exception $e) {
            return response()->json(['error' => 'Token inválido'], 401);
        }
    }
}