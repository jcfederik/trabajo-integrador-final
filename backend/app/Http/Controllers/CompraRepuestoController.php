<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CompraRepuesto;
use Illuminate\Support\Facades\Validator;

/**
 * @OA\Tag(
 *     name="Compra de Repuestos",
 *     description="Operaciones relacionadas con la gestión de compras de repuestos"
 * )
 *
 * @OA\Schema(
 *     schema="CompraRepuesto",
 *     type="object",
 *     title="Compra de Repuesto",
 *     description="Modelo de Compra de Repuesto",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="proveedor_id", type="integer", example=3),
 *     @OA\Property(property="repuesto_id", type="integer", example=7),
 *     @OA\Property(property="numero_comprobante", type="string", example="FAC-2025-001"),
 *     @OA\Property(property="total", type="number", format="float", example=25900.50),
 *     @OA\Property(property="estado", type="boolean", example=true),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 */
class CompraRepuestoController extends Controller
{

    /**
     * @OA\Get(
     *     path="/api/compra-repuesto",
     *     summary="Obtener todas las compras de repuestos",
     *     tags={"Compra de Repuestos"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="Lista de compras obtenida correctamente"),
     *     @OA\Response(response=500, description="Error al obtener las compras de repuestos")
     * )
     */
    public function index()
    {
        try {
            $compraRepuestos = CompraRepuesto::all();
            return response()->json($compraRepuestos, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener las compras de repuestos', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/compra-repuesto",
     *     summary="Crear una nueva compra de repuesto",
     *     tags={"Compra de Repuestos"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"proveedor_id", "repuesto_id", "numero_comprobante", "total", "estado"},
     *             @OA\Property(property="proveedor_id", type="integer", example=3),
     *             @OA\Property(property="repuesto_id", type="integer", example=7),
     *             @OA\Property(property="numero_comprobante", type="string", example="FAC-2025-001"),
     *             @OA\Property(property="total", type="number", example=25900.50),
     *             @OA\Property(property="estado", type="boolean", example=true)
     *         )
     *     ),
     *     @OA\Response(response=201, description="Compra creada correctamente"),
     *     @OA\Response(response=400, description="Datos inválidos"),
     *     @OA\Response(response=500, description="Error al crear la compra de repuesto")
     * )
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'proveedor_id' => 'required|exists:proveedor,id',
            'repuesto_id' => 'required|exists:repuesto,id',
            'numero_comprobante' => 'required|alpha_num',
            'total' => 'required|numeric|min:0',
            'estado' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Datos inválidos', 'detalles' => $validator->errors()], 400);
        }

        try {
            $compraRepuesto = CompraRepuesto::create($validator->validated());
            return response()->json(['mensaje' => 'Compra de repuesto creada correctamente', 'compraRepuesto' => $compraRepuesto], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al crear la compra de repuesto', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/compra-repuesto/{id}",
     *     summary="Obtener una compra de repuesto específica",
     *     tags={"Compra de Repuestos"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID de la compra de repuesto",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Compra encontrada"),
     *     @OA\Response(response=404, description="Compra de repuesto no encontrada")
     * )
     */
    public function show(string $id)
    {
        $compraRepuesto = CompraRepuesto::find($id);
        if (!$compraRepuesto) {
            return response()->json(['error' => 'Compra de repuesto no encontrada'], 404);
        }
        return response()->json($compraRepuesto, 200);
    }

    /**
     * @OA\Put(
     *     path="/api/compra-repuesto/{id}",
     *     summary="Actualizar una compra de repuesto existente",
     *     tags={"Compra de Repuestos"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID de la compra de repuesto a actualizar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="numero_comprobante", type="string", example="FAC-2025-002"),
     *             @OA\Property(property="total", type="number", example=27000.00),
     *             @OA\Property(property="estado", type="boolean", example=false)
     *         )
     *     ),
     *     @OA\Response(response=200, description="Compra de repuesto actualizada correctamente"),
     *     @OA\Response(response=404, description="Compra de repuesto no encontrada"),
     *     @OA\Response(response=500, description="Error al actualizar la compra de repuesto")
     * )
     */
    public function update(Request $request, string $id)
    {
        $compraRepuesto = CompraRepuesto::find($id);
        if (!$compraRepuesto) {
            return response()->json(['error' => 'Compra de repuesto no encontrada'], 404);
        }

        try {
            $compraRepuesto->update($request->all());
            return response()->json(['mensaje' => 'Compra de repuesto actualizada correctamente', 'compraRepuesto' => $compraRepuesto], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al actualizar la compra de repuesto', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/compra-repuesto/{id}",
     *     summary="Eliminar una compra de repuesto",
     *     tags={"Compra de Repuestos"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID de la compra de repuesto a eliminar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Compra de repuesto eliminada correctamente"),
     *     @OA\Response(response=404, description="Compra de repuesto no encontrada"),
     *     @OA\Response(response=500, description="Error al eliminar la compra de repuesto")
     * )
     */
    public function destroy(string $id)
    {
        $compraRepuesto = CompraRepuesto::find($id);
        if (!$compraRepuesto) {
            return response()->json(['error' => 'Compra de repuesto no encontrada'], 404);
        }

        try {
            $compraRepuesto->delete();
            return response()->json(['mensaje' => 'Compra de repuesto eliminada correctamente'], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al eliminar la compra de repuesto', 'detalle' => $e->getMessage()], 500);
        }
    }
}
