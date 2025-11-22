<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php', 
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // 🔹 Grupos opcionales (si querés agregar middleware globales)
        $middleware->group('web', [
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ]);

        $middleware->group('api', [
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ]);

        // 🔹 Aliases de middleware personalizados
        $middleware->alias([
            // Middleware de autenticación JWT (verifica el token)
            'jwt.auth' => \Tymon\JWTAuth\Http\Middleware\Authenticate::class,
            'jwt.check' => \Tymon\JWTAuth\Http\Middleware\Check::class,

            // Middleware para restringir acceso solo a administradores
            'admin' => \App\Http\Middleware\AdminMiddleware::class,

            // 🔹 NUEVO: Middleware para verificar permisos personalizados
            'permission' => \App\Http\Middleware\CheckPermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })
    ->create();