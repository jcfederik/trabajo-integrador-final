<?php

namespace App\Http\Controllers;

use App\Models\DetalleCobro;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;

/**
 * @OA\Tag(
 *     name="Detalles de Cobro",
 *     description="Operaciones relacionadas con la gestión de los detalles de cobro"
 * )
 *
 * @OA\Schema(
 *     schema="DetalleCobro",
 *     type="object",
 *     title="DetalleCobro",
 *     description="Modelo de Detalle de Cobro",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="medio_cobro_id", type="integer", example=2),
 *     @OA\Property(property="monto_pagado", type="number", format="float", example=1500.50),
 *     @OA\Property(property="fecha", type="string", format="date", example="2025-10-16"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 */
class DetalleCobroController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/detalle-cobro",
     *     summary="Obtener todos los detalles de cobro",
     *     tags={"Detalles de Cobro"},
     *     @OA\Response(response=200, description="Lista de detalles de cobro obtenida correctamente"),
     *     @OA\Response(response=500, description="Error al obtener los detalles de cobro")
     * )
     */
    public function index()
    {
        try {
            $detalleCobros = DetalleCobro::all();
            return response()->json($detalleCobros, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener los detalles de cobro', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/detalle-cobro",
     *     summary="Crear un nuevo detalle de cobro",
     *     tags={"Detalles de Cobro"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"medio_cobro_id", "monto_pagado", "fecha"},
     *             @OA\Property(property="medio_cobro_id", type="integer", example=2),
     *             @OA\Property(property="monto_pagado", type="number", format="float", example=1500.50),
     *             @OA\Property(property="fecha", type="string", format="date", example="2025-10-16")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Detalle de cobro creado correctamente"),
     *     @OA\Response(response=400, description="Validación fallida"),
     *     @OA\Response(response=500, description="Error al crear el detalle de cobro")
     * )
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'medio_cobro_id' => 'required|integer|exists:medio_cobro,id',
            'monto_pagado' => 'required|numeric|min:0',
            'fecha' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Validación fallida', 'detalle' => $validator->errors()], 400);
        }

        try {
            $detalleCobro = DetalleCobro::create($validator->validated());
            return response()->json(['mensaje' => 'Detalle de cobro creado correctamente', 'detalle' => $detalleCobro], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al crear el detalle de cobro', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/detalle-cobro/{id}",
     *     summary="Obtener un detalle de cobro específico",
     *     tags={"Detalles de Cobro"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del detalle de cobro",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Detalle de cobro encontrado"),
     *     @OA\Response(response=404, description="Detalle de cobro no encontrado")
     * )
     */
    public function show($id)
    {
        $detalleCobro = DetalleCobro::find($id);
        if (!$detalleCobro) {
            return response()->json(['error' => 'Detalle de cobro no encontrado'], 404);
        }
        return response()->json($detalleCobro, 200);
    }

    /**
     * @OA\Put(
     *     path="/api/detalle-cobro/{id}",
     *     summary="Actualizar un detalle de cobro existente",
     *     tags={"Detalles de Cobro"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del detalle de cobro a actualizar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="medio_cobro_id", type="integer", example=3),
     *             @OA\Property(property="monto_pagado", type="number", format="float", example=2000.75),
     *             @OA\Property(property="fecha", type="string", format="date", example="2025-10-17")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Detalle de cobro actualizado correctamente"),
     *     @OA\Response(response=404, description="Detalle de cobro no encontrado"),
     *     @OA\Response(response=500, description="Error al actualizar el detalle de cobro")
     * )
     */
    public function update(Request $request, $id)
    {
        $detalleCobro = DetalleCobro::find($id);
        if (!$detalleCobro) {
            return response()->json(['error' => 'Detalle de cobro no encontrado'], 404);
        }

        try {
            $detalleCobro->update($request->all());
            return response()->json(['mensaje' => 'Detalle de cobro actualizado correctamente', 'detalle_cobro' => $detalleCobro], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al actualizar el detalle de cobro', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/detalle-cobro/{id}",
     *     summary="Eliminar un detalle de cobro",
     *     tags={"Detalles de Cobro"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del detalle de cobro a eliminar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Detalle de cobro eliminado correctamente"),
     *     @OA\Response(response=404, description="Detalle de cobro no encontrado"),
     *     @OA\Response(response=500, description="Error al eliminar el detalle de cobro")
     * )
     */
    public function destroy($id)
    {
        $detalleCobro = DetalleCobro::find($id);
        if (!$detalleCobro) {
            return response()->json(['error' => 'Detalle de cobro no encontrado'], 404);
        }

        try {
            $detalleCobro->delete();
            return response()->json(['mensaje' => 'Detalle de cobro eliminado correctamente'], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al eliminar el detalle de cobro', 'detalle' => $e->getMessage()], 500);
        }
    }
}
