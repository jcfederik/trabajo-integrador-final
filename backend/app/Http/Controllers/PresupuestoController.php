<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Presupuesto;
use Illuminate\Support\Facades\Validator;

/**
 * @OA\Tag(
 *     name="Presupuestos",
 *     description="Operaciones relacionadas con la gestión de presupuestos"
 * )
 *
 * @OA\Schema(
 *     schema="Presupuesto",
 *     type="object",
 *     title="Presupuesto",
 *     description="Modelo de Presupuesto",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="reparacion_id", type="integer", example=5),
 *     @OA\Property(property="monto_total", type="number", format="float", example=12500.75),
 *     @OA\Property(property="aceptado", type="boolean", example=true),
 *     @OA\Property(property="fecha", type="string", format="date-time", example="2025-10-11T15:00:00Z"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 */
class PresupuestoController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/presupuesto",
     *     summary="Obtener todos los presupuestos",
     *     tags={"Presupuestos"},
     *     @OA\Response(response=200, description="Lista de presupuestos obtenida correctamente"),
     *     @OA\Response(response=500, description="Error al obtener los presupuestos")
     * )
     */
    public function index()
    {
        try {
            $presupuestos = Presupuesto::all();
            return response()->json($presupuestos, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener los presupuestos', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/presupuesto",
     *     summary="Crear un nuevo presupuesto",
     *     tags={"Presupuestos"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"reparacion_id", "monto_total", "aceptado", "fecha"},
     *             @OA\Property(property="reparacion_id", type="integer", example=5),
     *             @OA\Property(property="monto_total", type="number", example=12500.75),
     *             @OA\Property(property="aceptado", type="boolean", example=true),
     *             @OA\Property(property="fecha", type="string", format="date-time", example="2025-10-11T15:00:00Z")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Presupuesto creado correctamente"),
     *     @OA\Response(response=400, description="Datos inválidos"),
     *     @OA\Response(response=500, description="Error al crear el presupuesto")
     * )
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'reparacion_id' => 'required|exists:reparacion,id',
            'monto_total' => 'required|numeric|min:0',
            'aceptado' => 'required|boolean',
            'fecha' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Datos inválidos', 'detalles' => $validator->errors()], 400);
        }

        try {
            $presupuesto = Presupuesto::create($validator->validated());
            return response()->json(['mensaje' => 'Presupuesto creado correctamente', 'presupuesto' => $presupuesto], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al crear el presupuesto', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/presupuesto/{id}",
     *     summary="Obtener un presupuesto específico",
     *     tags={"Presupuestos"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del presupuesto",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Presupuesto encontrado"),
     *     @OA\Response(response=404, description="Presupuesto no encontrado")
     * )
     */
    public function show($id)
    {
        $presupuesto = Presupuesto::find($id);
        if (!$presupuesto) {
            return response()->json(['error' => 'Presupuesto no encontrado'], 404);
        }
        return response()->json($presupuesto, 200);
    }

    /**
     * @OA\Put(
     *     path="/api/presupuesto/{id}",
     *     summary="Actualizar un presupuesto existente",
     *     tags={"Presupuestos"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del presupuesto a actualizar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="monto_total", type="number", example=15000.00),
     *             @OA\Property(property="aceptado", type="boolean", example=false),
     *             @OA\Property(property="fecha", type="string", format="date-time", example="2025-10-12T16:00:00Z")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Presupuesto actualizado correctamente"),
     *     @OA\Response(response=404, description="Presupuesto no encontrado"),
     *     @OA\Response(response=500, description="Error al actualizar el presupuesto")
     * )
     */
    public function update(Request $request, $id)
    {
        $presupuesto = Presupuesto::find($id);
        if (!$presupuesto) {
            return response()->json(['error' => 'Presupuesto no encontrado'], 404);
        }

        try {
            $presupuesto->update($request->all());
            return response()->json(['mensaje' => 'Presupuesto actualizado correctamente', 'presupuesto' => $presupuesto], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al actualizar el presupuesto', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/presupuesto/{id}",
     *     summary="Eliminar un presupuesto",
     *     tags={"Presupuestos"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del presupuesto a eliminar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Presupuesto eliminado correctamente"),
     *     @OA\Response(response=404, description="Presupuesto no encontrado"),
     *     @OA\Response(response=500, description="Error al eliminar el presupuesto")
     * )
     */
    public function destroy($id)
    {
        $presupuesto = Presupuesto::find($id);
        if (!$presupuesto) {
            return response()->json(['error' => 'Presupuesto no encontrado'], 404);
        }

        try {
            $presupuesto->delete();
            return response()->json(['mensaje' => 'Presupuesto eliminado correctamente'], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al eliminar el presupuesto', 'detalle' => $e->getMessage()], 500);
        }
    }
}
