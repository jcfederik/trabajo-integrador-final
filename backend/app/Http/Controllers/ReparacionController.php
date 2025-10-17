<?php

namespace App\Http\Controllers;

use App\Models\Reparacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * @OA\Tag(
 *     name="Reparaciones",
 *     description="Operaciones relacionadas con las reparaciones de equipos"
 * )
 */
class ReparacionController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/reparaciones",
     *     summary="Listar todas las reparaciones",
     *     tags={"Reparaciones"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200, 
     *         description="Lista de reparaciones obtenida correctamente",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(ref="#/components/schemas/Reparacion")
     *         )
     *     ),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=500, description="Error al obtener las reparaciones")
     * )
     */
    public function index()
    {
        try {
            $reparaciones = Reparacion::with(['equipo', 'tecnico', 'repuestos'])->get();
            return response()->json($reparaciones, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener las reparaciones', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/reparaciones",
     *     summary="Registrar una nueva reparación",
     *     tags={"Reparaciones"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"equipo_id", "usuario_id", "descripcion", "fecha", "estado"},
     *             @OA\Property(property="equipo_id", type="integer", example=2),
     *             @OA\Property(property="usuario_id", type="integer", example=5),
     *             @OA\Property(property="descripcion", type="string", example="Reemplazo de placa madre"),
     *             @OA\Property(property="fecha", type="string", format="date-time", example="2025-10-11T12:00:00Z"),
     *             @OA\Property(property="estado", type="string", example="pendiente")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201, 
     *         description="Reparación creada correctamente",
     *         @OA\JsonContent(ref="#/components/schemas/Reparacion")
     *     ),
     *     @OA\Response(response=400, description="Datos inválidos"),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=500, description="Error al crear la reparación")
     * )
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'equipo_id' => 'required|exists:equipo,id',
            'usuario_id' => 'required|exists:usuario,id',
            'descripcion' => 'required|string',
            'fecha' => 'required|date',
            'estado' => 'required|string|max:50'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Datos inválidos', 'detalles' => $validator->errors()], 400);
        }

        try {
            $reparacion = Reparacion::create($validator->validated());
            return response()->json(['mensaje' => 'Reparación registrada correctamente', 'reparacion' => $reparacion], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al crear la reparación', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/reparaciones/{id}",
     *     summary="Mostrar una reparación específica",
     *     tags={"Reparaciones"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID de la reparación",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200, 
     *         description="Reparación encontrada",
     *         @OA\JsonContent(ref="#/components/schemas/Reparacion")
     *     ),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=404, description="Reparación no encontrada")
     * )
     */
    public function show($id)
    {
        $reparacion = Reparacion::with(['equipo', 'tecnico', 'repuestos'])->find($id);
        if (!$reparacion) {
            return response()->json(['error' => 'Reparación no encontrada'], 404);
        }
        return response()->json($reparacion, 200);
    }

    /**
     * @OA\Put(
     *     path="/api/reparaciones/{id}",
     *     summary="Actualizar una reparación existente",
     *     tags={"Reparaciones"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID de la reparación a actualizar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="descripcion", type="string", example="Cambio de disco rígido y reinstalación de sistema operativo"),
     *             @OA\Property(property="fecha", type="string", format="date-time", example="2025-10-11T14:00:00Z"),
     *             @OA\Property(property="estado", type="string", example="finalizada")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200, 
     *         description="Reparación actualizada correctamente",
     *         @OA\JsonContent(ref="#/components/schemas/Reparacion")
     *     ),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=404, description="Reparación no encontrada"),
     *     @OA\Response(response=500, description="Error al actualizar la reparación")
     * )
     */
    public function update(Request $request, $id)
    {
        $reparacion = Reparacion::find($id);
        if (!$reparacion) {
            return response()->json(['error' => 'Reparación no encontrada'], 404);
        }

        try {
            $reparacion->update($request->all());
            return response()->json(['mensaje' => 'Reparación actualizada correctamente', 'reparacion' => $reparacion], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al actualizar la reparación', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/reparaciones/{id}",
     *     summary="Eliminar una reparación",
     *     tags={"Reparaciones"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID de la reparación a eliminar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Reparación eliminada correctamente"),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=404, description="Reparación no encontrada"),
     *     @OA\Response(response=500, description="Error al eliminar la reparación")
     * )
     */
    public function destroy($id)
    {
        $reparacion = Reparacion::find($id);
        if (!$reparacion) {
            return response()->json(['error' => 'Reparación no encontrada'], 404);
        }

        try {
            $reparacion->delete();
            return response()->json(['mensaje' => 'Reparación eliminada correctamente'], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al eliminar la reparación', 'detalle' => $e->getMessage()], 500);
        }
    }
}