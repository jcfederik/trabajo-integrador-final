<?php

namespace App\Http\Controllers;

use App\Models\Equipo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * @OA\Tag(
 *     name="Equipos",
 *     description="Operaciones relacionadas con los equipos registrados en el sistema"
 * )
 */
class EquipoController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/equipos",
     *     summary="Obtener todos los equipos registrados",
     *     tags={"Equipos"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Lista de equipos obtenida correctamente",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(ref="#/components/schemas/Equipo")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="No autorizado"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error al obtener los equipos"
     *     )
     * )
     */
    public function index()
    {
        try {
            $equipos = Equipo::all();
            return response()->json($equipos, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener equipos', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/equipos",
     *     summary="Registrar un nuevo equipo",
     *     tags={"Equipos"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"descripcion"},
     *             @OA\Property(property="descripcion", type="string", example="Notebook con problema de encendido"),
     *             @OA\Property(property="marca", type="string", example="HP"),
     *             @OA\Property(property="modelo", type="string", example="Pavilion 14"),
     *             @OA\Property(property="nro_serie", type="string", example="HP123XYZ")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Equipo creado correctamente",
     *         @OA\JsonContent(ref="#/components/schemas/Equipo")
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Datos inválidos"
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="No autorizado"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error al crear equipo"
     *     )
     * )
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'descripcion' => 'required|string|max:200',
            'marca' => 'nullable|string|max:100',
            'modelo' => 'nullable|string|max:100',
            'nro_serie' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Datos inválidos', 'detalles' => $validator->errors()], 400);
        }

        try {
            $equipo = Equipo::create($validator->validated());
            return response()->json(['mensaje' => 'Equipo creado correctamente', 'equipo' => $equipo], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al crear equipo', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/equipos/{id}",
     *     summary="Mostrar un equipo específico",
     *     tags={"Equipos"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del equipo a mostrar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Equipo encontrado correctamente",
     *         @OA\JsonContent(ref="#/components/schemas/Equipo")
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="No autorizado"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Equipo no encontrado"
     *     )
     * )
     */
    public function show($id)
    {
        try {
            $equipo = Equipo::findOrFail($id);
            return response()->json($equipo, 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Equipo no encontrado'], 404);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error inesperado', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Put(
     *     path="/api/equipos/{id}",
     *     summary="Actualizar un equipo existente",
     *     tags={"Equipos"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del equipo a actualizar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="descripcion", type="string", example="Notebook con batería reemplazada"),
     *             @OA\Property(property="marca", type="string", example="Dell"),
     *             @OA\Property(property="modelo", type="string", example="Inspiron 15"),
     *             @OA\Property(property="nro_serie", type="string", example="DL1234ABC")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Equipo actualizado correctamente",
     *         @OA\JsonContent(ref="#/components/schemas/Equipo")
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Datos inválidos"
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="No autorizado"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Equipo no encontrado"
     *     )
     * )
     */
    public function update(Request $request, $id)
    {
        try {
            $equipo = Equipo::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'descripcion' => 'required|string|max:200',
                'marca' => 'nullable|string|max:100',
                'modelo' => 'nullable|string|max:100',
                'nro_serie' => 'nullable|string|max:100',
            ]);

            if ($validator->fails()) {
                return response()->json(['error' => 'Datos inválidos', 'detalles' => $validator->errors()], 400);
            }

            $equipo->update($validator->validated());
            return response()->json(['mensaje' => 'Equipo actualizado correctamente', 'equipo' => $equipo], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Equipo no encontrado'], 404);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al actualizar equipo', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/equipos/{id}",
     *     summary="Eliminar un equipo del sistema",
     *     tags={"Equipos"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del equipo a eliminar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Equipo eliminado correctamente"
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="No autorizado"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Equipo no encontrado"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error al eliminar equipo"
     *     )
     * )
     */
    public function destroy($id)
    {
        try {
            $equipo = Equipo::findOrFail($id);
            $equipo->delete();

            return response()->json(['mensaje' => 'Equipo eliminado correctamente'], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Equipo no encontrado'], 404);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al eliminar equipo', 'detalle' => $e->getMessage()], 500);
        }
    }
}