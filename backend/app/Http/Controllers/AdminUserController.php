<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Especializacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * @OA\Tag(name="Administración", description="Endpoints para administradores y técnicos (gestión de usuarios y especializaciones)")
 */
class AdminUserController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/users",
     *     summary="Listar todos los usuarios",
     *     tags={"Administración"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Lista de usuarios",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/User"))
     *         )
     *     )
     * )
     */
    public function index()
    {
        $users = User::with('especializaciones')->get();

        return response()->json([
            'data' => $users
        ]);
    }

    /**
     * @OA\Get(
     *     path="/api/users/{id}",
     *     summary="Obtener usuario específico con especializaciones",
     *     tags={"Administración"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Usuario encontrado"),
     *     @OA\Response(response=404, description="Usuario no encontrado")
     * )
     */
    public function show(User $user)
    {
        $user->load('especializaciones');

        return response()->json([
            'data' => $user
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/users",
     *     summary="Crear nuevo usuario (solo administradores)",
     *     tags={"Administración"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"nombre","tipo","password"},
     *             @OA\Property(property="nombre", type="string", example="tecnico1"),
     *             @OA\Property(property="tipo", type="string", enum={"administrador", "tecnico", "usuario"}, example="tecnico"),
     *             @OA\Property(property="password", type="string", example="password123"),
     *             @OA\Property(property="especializaciones", type="array", @OA\Items(type="integer"), example={1,2})
     *         )
     *     ),
     *     @OA\Response(response=201, description="Usuario creado"),
     *     @OA\Response(response=403, description="No autorizado"),
     *     @OA\Response(response=422, description="Validación fallida")
     * )
     */
    public function store(Request $request)
{
    try {
        $currentUser = JWTAuth::user();

        if ($currentUser->tipo !== 'administrador') {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'tipo' => 'required|string|in:administrador,tecnico,usuario',
            'password' => 'required|string|min:8',
            'especializaciones' => 'array',
            'especializaciones.*' => 'exists:especializacion,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Error de validación: revisá los campos ingresados.',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'nombre' => $request->nombre,
            'tipo' => $request->tipo,
            'password' => Hash::make($request->password),
        ]);

        if (in_array($user->tipo, ['tecnico', 'administrador']) && $request->has('especializaciones')) {
            $user->especializaciones()->sync($request->especializaciones);
        }

        return response()->json([
            'message' => 'Usuario creado exitosamente',
            'data' => $user->load('especializaciones')
        ], 201);

    } catch (\Throwable $e) {
        return response()->json([
            'error' => 'Error interno en el servidor',
            'exception' => $e->getMessage(),
            'line' => $e->getLine(),
            'file' => $e->getFile()
        ], 500);
    }
}


    /**
     * @OA\Put(
     *     path="/api/users/{id}",
     *     summary="Actualizar usuario (solo administradores)",
     *     tags={"Administración"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="nombre", type="string", example="nuevo_nombre"),
     *             @OA\Property(property="tipo", type="string", enum={"administrador", "tecnico", "usuario"}, example="tecnico"),
     *             @OA\Property(property="password", type="string", example="nueva_password"),
     *             @OA\Property(property="especializaciones", type="array", @OA\Items(type="integer"), example={1,3})
     *         )
     *     ),
     *     @OA\Response(response=200, description="Usuario actualizado")
     * )
     */
    public function update(Request $request, User $user)
    {
        $currentUser = JWTAuth::user();

        if ($currentUser->tipo !== 'administrador') {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'tipo' => 'required|string|in:administrador,tecnico,usuario',
            'password' => 'required|string|min:8',
            'especializaciones' => 'array',
            'especializaciones.*' => 'exists:especializacion,id'
        ]);

        if ($validator->fails()) {
    return response()->json([
        'message' => 'Error de validación: revisá los campos ingresados.',
        'errors' => $validator->errors()
    ], 422);
}



        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }

        $user->nombre = $request->nombre;
        $user->tipo = $request->tipo;

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        // Actualizar especializaciones solo si aplica
        if (in_array($user->tipo, ['tecnico', 'administrador']) && $request->has('especializaciones')) {
            $user->especializaciones()->sync($request->especializaciones);
        }

        return response()->json([
            'message' => 'Usuario actualizado exitosamente',
            'data' => $user->load('especializaciones')
        ]);
    }

    /**
     * @OA\Delete(
     *     path="/api/users/{id}",
     *     summary="Eliminar usuario (solo administradores)",
     *     tags={"Administración"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Usuario eliminado"),
     *     @OA\Response(response=403, description="No autorizado"),
     *     @OA\Response(response=422, description="No puedes eliminar tu propio usuario")
     * )
     */
    public function destroy(User $user)
    {
        $currentUser = JWTAuth::user();

        if ($currentUser->tipo !== 'administrador') {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        if ($currentUser->id === $user->id) {
            return response()->json(['error' => 'No puedes eliminar tu propio usuario'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'Usuario eliminado exitosamente']);
    }

    /**
     * @OA\Post(
     *     path="/api/profile/especializaciones",
     *     summary="Asignar especializaciones al usuario autenticado (técnico o admin)",
     *     tags={"Administración"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="especializaciones", type="array", @OA\Items(type="integer"), example={1,2})
     *         )
     *     ),
     *     @OA\Response(response=200, description="Especializaciones actualizadas correctamente"),
     *     @OA\Response(response=403, description="No autorizado")
     * )
     */
    public function asignarEspecializaciones(Request $request)
    {
        $user = JWTAuth::user();

        if (!in_array($user->tipo, ['tecnico', 'administrador'])) {
            return response()->json(['error' => 'Solo técnicos o administradores pueden modificar especializaciones'], 403);
        }

        $request->validate([
            'especializaciones' => 'required|array'
        ]);

        $user->especializaciones()->sync($request->especializaciones);

        return response()->json(['mensaje' => 'Especializaciones actualizadas correctamente']);
    }
}
