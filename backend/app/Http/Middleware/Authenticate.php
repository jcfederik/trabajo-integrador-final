<?php

namespace App\Http\Middleware;

use Closure;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;
use Tymon\JWTAuth\Exceptions\JWTException;

class Authenticate
{
    public function handle($request, Closure $next)
    {
        try {
            JWTAuth::parseToken()->authenticate();
        } catch (TokenExpiredException $e) {
            return response()->json(['error' => 'El token ha expirado.'], 401);
        } catch (TokenInvalidException $e) {
            return response()->json(['error' => 'El token es inválido.'], 401);
        } catch (JWTException $e) {
            return response()->json(['error' => 'Token no encontrado.'], 401);
        }

        return $next($request);
    }
}
