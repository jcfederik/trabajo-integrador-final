<?php
namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * @OA\Tag(name="Administración", description="Endpoints para administradores")
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
     *     ),
     *     @OA\Response(response=403, description="No autorizado")
     * )
     */
    public function index()
    {
        $users = User::all();
        return response()->json([
            'data' => $users
        ]);
    }

    /**
     * @OA\Get(
     *     path="/api/users/{id}",
     *     summary="Obtener usuario específico",
     *     tags={"Administración"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Usuario encontrado",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", ref="#/components/schemas/User")
     *         )
     *     ),
     *     @OA\Response(response=404, description="Usuario no encontrado")
     * )
     */
    public function show(User $user)
    {
        return response()->json([
            'data' => $user
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/users",
     *     summary="Crear nuevo usuario",
     *     tags={"Administración"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"nombre","tipo","password"},
     *             @OA\Property(property="nombre", type="string", example="tecnico1"),
     *             @OA\Property(property="tipo", type="string", enum={"administrador", "tecnico", "usuario"}, example="tecnico"),
     *             @OA\Property(property="password", type="string", example="password123")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Usuario creado",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Usuario creado exitosamente"),
     *             @OA\Property(property="data", ref="#/components/schemas/User")
     *         )
     *     ),
     *     @OA\Response(response=422, description="Validación fallida")
     * )
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'tipo' => 'required|string|max:255|in:administrador,tecnico,usuario',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'nombre' => $request->nombre,
            'tipo' => $request->tipo,
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'message' => 'Usuario creado exitosamente',
            'data' => $user
        ], 201);
    }

    /**
     * @OA\Put(
     *     path="/api/users/{id}",
     *     summary="Actualizar usuario",
     *     tags={"Administración"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"nombre","tipo"},
     *             @OA\Property(property="nombre", type="string", example="nuevo_nombre"),
     *             @OA\Property(property="tipo", type="string", enum={"administrador", "tecnico", "usuario"}, example="tecnico"),
     *             @OA\Property(property="password", type="string", example="nueva_password")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Usuario actualizado",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Usuario actualizado exitosamente"),
     *             @OA\Property(property="data", ref="#/components/schemas/User")
     *         )
     *     )
     * )
     */
    public function update(Request $request, User $user)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'tipo' => 'required|string|in:administrador,tecnico,usuario',
            'password' => 'nullable|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => $validator->errors()
            ], 422);
        }

        $user->nombre = $request->nombre;
        $user->tipo = $request->tipo;

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return response()->json([
            'message' => 'Usuario actualizado exitosamente',
            'data' => $user
        ]);
    }

    /**
     * @OA\Delete(
     *     path="/api/users/{id}",
     *     summary="Eliminar usuario",
     *     tags={"Administración"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Usuario eliminado",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Usuario eliminado exitosamente")
     *         )
     *     ),
     *     @OA\Response(response=422, description="No puedes eliminar tu propio usuario")
     * )
     */
    public function destroy(User $user)
    {
        $currentUser = JWTAuth::user();
        
        if ($currentUser->id === $user->id) {
            return response()->json([
                'error' => 'No puedes eliminar tu propio usuario'
            ], 422);
        }

        $user->delete();

        return response()->json([
            'message' => 'Usuario eliminado exitosamente'
        ]);
    }
}