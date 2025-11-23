<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;

class CheckPermission
{
    public function handle(Request $request, Closure $next, $permission): Response
{
    try {
        $user = JWTAuth::parseToken()->authenticate();
        
        if (!$user || !$user->hasPermission($permission)) { // ✅ Cambiado a hasPermission
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