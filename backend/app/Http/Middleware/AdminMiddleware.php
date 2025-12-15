<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
            
            if (!$user) {
                return response()->json([
                    'error' => 'No autenticado'
                ], 401);
            }

            if ($user->tipo !== 'administrador') {
                return response()->json([
                    'error' => 'No tienes permisos de administrador'
                ], 403);
            }

            return $next($request);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Token inválido o expirado'
            ], 401);
        }
    }
}