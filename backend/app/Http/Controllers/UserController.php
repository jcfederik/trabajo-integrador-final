<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * @OA\Tag(name="Usuario", description="Endpoints para gestión del perfil de usuario")
 */
class UserController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/profile",
     *     summary="Obtener perfil del usuario autenticado",
     *     tags={"Usuario"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Perfil del usuario",
     *         @OA\JsonContent(ref="#/components/schemas/User")
     *     ),
     *     @OA\Response(response=401, description="No autenticado")
     * )
     */
    public function index(Request $request)
    {
        $user = JWTAuth::user();
        return response()->json([
            'data' => $user
        ]);
    }

    /**
     * @OA\Put(
     *     path="/api/profile",
     *     summary="Actualizar perfil del usuario autenticado",
     *     tags={"Usuario"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"nombre"},
     *             @OA\Property(property="nombre", type="string", example="nuevo_nombre"),
     *             @OA\Property(property="password", type="string", example="nueva_contraseña")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Perfil actualizado exitosamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Perfil actualizado exitosamente"),
     *             @OA\Property(property="data", ref="#/components/schemas/User")
     *         )
     *     ),
     *     @OA\Response(response=422, description="Validación fallida")
     * )
     */
    public function update(Request $request)
    {
        $user = JWTAuth::user();

        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'password' => 'nullable|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => $validator->errors()
            ], 422);
        }

        $user->nombre = $request->nombre;

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return response()->json([
            'message' => 'Perfil actualizado exitosamente',
            'data' => $user
        ]);
    }

    /**
     * @OA\Get(
     *     path="/api/profile/{id}",
     *     summary="NO PERMITIDO - Ver usuario específico",
     *     tags={"Usuario"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=405,
     *         description="Método no permitido"
     *     )
     * )
     */
    public function show($id)
    {
        return response()->json(['error' => 'Método no permitido'], 405);
    }

    /**
     * @OA\Post(
     *     path="/api/profile",
     *     summary="NO PERMITIDO - Crear usuario",
     *     tags={"Usuario"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=405,
     *         description="Método no permitido"
     *     )
     * )
     */
    public function store(Request $request)
    {
        return response()->json(['error' => 'Método no permitido'], 405);
    }

    /**
     * @OA\Delete(
     *     path="/api/profile/{id}",
     *     summary="NO PERMITIDO - Eliminar usuario",
     *     tags={"Usuario"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=405,
     *         description="Método no permitido"
     *     )
     * )
     */
    public function destroy($id)
    {
        return response()->json(['error' => 'Método no permitido'], 405);
    }
}