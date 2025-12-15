<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;

/**
 * @OA\Tag(name="Autenticación", description="Endpoints de autenticación con JWT")
 */
class AuthController extends Controller
{
    /**
     * @OA\Post(
     *     path="/api/login",
     *     summary="Iniciar sesión",
     *     tags={"Autenticación"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"nombre","password"},
     *             @OA\Property(property="nombre", type="string", example="admin"),
     *             @OA\Property(property="password", type="string", example="admin123")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Login exitoso",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Inicio de sesión exitoso"),
     *             @OA\Property(property="user", type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="nombre", type="string", example="admin"),
     *                 @OA\Property(property="tipo", type="string", example="administrador"),
     *                 @OA\Property(property="permissions", type="array", 
     *                     @OA\Items(type="string", example="users.manage")
     *                 ),
     *                 @OA\Property(property="especializaciones", type="array", 
     *                     @OA\Items(type="object")
     *                 )
     *             ),
     *             @OA\Property(property="token", type="string"),
     *             @OA\Property(property="token_type", type="string", example="bearer"),
     *             @OA\Property(property="expires_in", type="integer", example=3600)
     *         )
     *     ),
     *     @OA\Response(response=401, description="Credenciales inválidas"),
     *     @OA\Response(response=500, description="Error interno")
     * )
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            if (!$token = JWTAuth::attempt($validator->validated())) {
                return response()->json([
                    'message' => 'Credenciales inválidas. Verificá tu usuario o contraseña.',
                    'error' => [
                        'nombre' => ['El nombre de usuario o la contraseña son incorrectos.']
                    ]
                ], 401);
            }

            $user = JWTAuth::user();

            // ✅ SOLUCIÓN DEFINITIVA: Mapear permisos manualmente
            $permissions = $this->getPermissionsByTipo($user->tipo);

            // ✅ PREPARAR USUARIO CON PERMISOS
            $userData = [
                'id' => $user->id,
                'nombre' => $user->nombre,
                'tipo' => $user->tipo,
                'permissions' => $permissions,
            ];

            // ✅ OPCIONAL: Incluir especializaciones si el usuario es técnico o admin
            if (in_array($user->tipo, ['tecnico', 'administrador'])) {
                $userData['especializaciones'] = $user->especializaciones;
            }

            return response()->json([
                'message' => 'Inicio de sesión exitoso',
                'user' => $userData,
                'token' => $token,
                'token_type' => 'bearer',
                'expires_in' => JWTAuth::factory()->getTTL() * 60
            ], 200);

        } catch (JWTException $e) {
            return response()->json([
                'message' => 'Error al generar el token.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/logout",
     *     summary="Cerrar sesión (invalidar token actual)",
     *     tags={"Autenticación"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Sesión cerrada exitosamente",
     *         @OA\JsonContent(@OA\Property(property="message", type="string"))
     *     ),
     *     @OA\Response(response=401, description="Token inválido o expirado")
     * )
     */
    public function logout()
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
            return response()->json(['message' => 'Sesión cerrada exitosamente.']);
        } catch (TokenExpiredException $e) {
            return response()->json(['error' => 'El token ya expiró.'], 401);
        } catch (TokenInvalidException $e) {
            return response()->json(['error' => 'El token es inválido.'], 401);
        } catch (JWTException $e) {
            return response()->json(['error' => 'No se encontró un token válido.'], 401);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/refresh",
     *     summary="Refrescar token JWT",
     *     tags={"Autenticación"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Token refrescado",
     *         @OA\JsonContent(
     *             @OA\Property(property="token", type="string"),
     *             @OA\Property(property="token_type", type="string", example="bearer"),
     *             @OA\Property(property="expires_in", type="integer", example=3600)
     *         )
     *     ),
     *     @OA\Response(response=401, description="Token inválido o expirado")
     * )
     */
    public function refresh()
    {
        try {
            $token = JWTAuth::refresh(JWTAuth::getToken());
            return response()->json([
                'token' => $token,
                'token_type' => 'bearer',
                'expires_in' => JWTAuth::factory()->getTTL() * 60
            ]);
        } catch (TokenExpiredException $e) {
            return response()->json(['error' => 'El token ha expirado, iniciá sesión nuevamente.'], 401);
        } catch (TokenInvalidException $e) {
            return response()->json(['error' => 'Token inválido.'], 401);
        } catch (JWTException $e) {
            return response()->json(['error' => 'No se pudo refrescar el token.'], 401);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/me",
     *     summary="Obtener usuario autenticado actual",
     *     tags={"Autenticación"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Usuario autenticado",
     *         @OA\JsonContent(
     *             @OA\Property(property="id", type="integer", example=1),
     *             @OA\Property(property="nombre", type="string", example="admin"),
     *             @OA\Property(property="tipo", type="string", example="administrador"),
     *             @OA\Property(property="permissions", type="array", 
     *                 @OA\Items(type="string", example="users.manage")
     *             ),
     *             @OA\Property(property="especializaciones", type="array", 
     *                 @OA\Items(type="object")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=401, description="Token inválido o expirado")
     * )
     */
    public function me()
    {
        try {
            $user = JWTAuth::user();
            
            if (!$user) {
                return response()->json(['error' => 'Usuario no autenticado.'], 401);
            }

            // ✅ Misma estructura que en login
            $permissions = $this->getPermissionsByTipo($user->tipo);
            
            $userData = [
                'id' => $user->id,
                'nombre' => $user->nombre,
                'tipo' => $user->tipo,
                'permissions' => $permissions,
            ];

            if (in_array($user->tipo, ['tecnico', 'administrador'])) {
                $userData['especializaciones'] = $user->especializaciones;
            }

            return response()->json($userData, 200);
            
        } catch (TokenExpiredException $e) {
            return response()->json(['error' => 'El token ha expirado.'], 401);
        } catch (TokenInvalidException $e) {
            return response()->json(['error' => 'Token inválido.'], 401);
        } catch (JWTException $e) {
            return response()->json(['error' => 'No se encontró un token válido.'], 401);
        }
    }

    /**
     * Método privado para obtener permisos por tipo de usuario
     */
    public static function getPermissionsByTipo($tipo)
    {
        $permissionsMap = [
            'administrador' => [
                'users.manage',
                'clients.manage',
                'equipos.manage',
                'reparaciones.manage',
                'facturas.manage',
                'cobros.manage',
                'proveedores.manage',
                'repuestos.manage',
                'presupuestos.manage',
                'especializaciones.manage',
                'reports.view',
                'dashboard.view',
                'historial-stock.view',   
                'historial-stock.manage', 
                'admin.full'
            ],
            'usuario' => [ // Secretarios/Administrativos
                'clients.manage',
                'equipos.manage',
                'presupuestos.manage',
                'reparaciones.manage',
                'facturas.create',
                'cobros.create',
                'dashboard.view',
                'user.basic'
            ],
            'tecnico' => [ // Técnicos reparadores - RESTRINGIDOS
                'reparaciones.view',
                'reparaciones.update.estado',
                'presupuestos.create',
                'presupuestos.view',
                'equipos.view',
                'repuestos.view',
                'especializaciones.view',
                'especializaciones.self_assign',
                'dashboard.view',
                'tecnico.basic'
            ]
        ];

        return $permissionsMap[$tipo] ?? [];
    }
}