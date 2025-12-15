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
    public function index()
    {
        $users = User::with('especializaciones')->get();

        return response()->json([
            'data' => $users
        ]);
    }

    public function show(User $user)
    {
        $user->load('especializaciones');

        return response()->json([
            'data' => $user
        ]);
    }

    public function store(Request $request)
    {
        try {
            $currentUser = JWTAuth::user();

            if (!$currentUser->isAdmin()) {
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

    public function update(Request $request, User $user)
    {
        $currentUser = JWTAuth::user();

        if (!$currentUser->isAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'tipo' => 'required|string|in:administrador,tecnico,usuario',
            'password' => 'sometimes|string|min:8',
            'especializaciones' => 'array',
            'especializaciones.*' => 'exists:especializacion,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Error de validación: revisá los campos ingresados.',
                'errors' => $validator->errors()
            ], 422);
        }

        $user->nombre = $request->nombre;
        $user->tipo = $request->tipo;

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        if (in_array($user->tipo, ['tecnico', 'administrador']) && $request->has('especializaciones')) {
            $user->especializaciones()->sync($request->especializaciones);
        }

        return response()->json([
            'message' => 'Usuario actualizado exitosamente',
            'data' => $user->load('especializaciones')
        ]);
    }

    public function destroy(User $user)
    {
        $currentUser = JWTAuth::user();

        if (!$currentUser->isAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        if ($currentUser->id === $user->id) {
            return response()->json(['error' => 'No puedes eliminar tu propio usuario'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'Usuario eliminado exitosamente']);
    }

    public function asignarEspecializaciones(Request $request)
    {
        $user = JWTAuth::user();

        if (!$user->isTecnico() && !$user->isAdmin()) {
            return response()->json([
                'error' => 'Solo técnicos o administradores pueden modificar especializaciones'
            ], 403);
        }

        $request->validate([
            'especializaciones' => 'required|array'
        ]);

        $user->especializaciones()->sync($request->especializaciones);

        return response()->json([
            'mensaje' => 'Especializaciones actualizadas correctamente'
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/admin/users/{id}/especializaciones",
     *     summary="Asignar especializaciones a un usuario específico (solo administradores)",
     *     tags={"Administración"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="especializaciones", type="array", @OA\Items(type="integer"), example={1,2})
     *         )
     *     ),
     *     @OA\Response(response=200, description="Especializaciones asignadas correctamente"),
     *     @OA\Response(response=403, description="No autorizado"),
     *     @OA\Response(response=404, description="Usuario no encontrado")
     * )
     */
    public function asignarEspecializacionesUsuario(Request $request, $id)
    {
        try {
            $currentUser = JWTAuth::user();

            if (!$currentUser->isAdmin()) {
                return response()->json(['error' => 'No autorizado. Solo administradores pueden asignar especializaciones.'], 403);
            }

            $user = User::findOrFail($id);

            if (!in_array($user->tipo, ['tecnico', 'administrador'])) {
                return response()->json(['error' => 'Solo se pueden asignar especializaciones a técnicos o administradores'], 422);
            }

            $request->validate([
                'especializaciones' => 'required|array',
                'especializaciones.*' => 'exists:especializacion,id'
            ]);

            $user->especializaciones()->sync($request->especializaciones);

            return response()->json([
                'mensaje' => 'Especializaciones asignadas correctamente',
                'data' => $user->load('especializaciones')
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al asignar especializaciones',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/users/{id}/especializaciones",
     *     summary="Auto-asignar especializaciones (para técnicos)",
     *     tags={"Autenticación"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="especializaciones", type="array", @OA\Items(type="integer"), example={1,2})
     *         )
     *     ),
     *     @OA\Response(response=200, description="Especializaciones asignadas correctamente"),
     *     @OA\Response(response=403, description="No autorizado"),
     *     @OA\Response(response=404, description="Usuario no encontrado")
     * )
     */
    public function autoAsignarEspecializaciones(Request $request, $id)
    {
        try {
            $currentUser = JWTAuth::user();
            
            if ($currentUser->id != $id) {
                return response()->json(['error' => 'Solo puedes auto-asignarte especializaciones a ti mismo'], 403);
            }

            $user = User::findOrFail($id);

            if ($user->tipo !== 'tecnico') {
                return response()->json(['error' => 'Solo los técnicos pueden auto-asignarse especializaciones'], 422);
            }

            $request->validate([
                'especializaciones' => 'required|array',
                'especializaciones.*' => 'exists:especializacion,id'
            ]);

            $user->especializaciones()->syncWithoutDetaching($request->especializaciones);

            return response()->json([
                'mensaje' => 'Especializaciones asignadas correctamente',
                'data' => $user->load('especializaciones')
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al asignar especializaciones',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }
}