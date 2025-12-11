<?php

namespace App\Http\Controllers;

use App\Models\HistorialStock;
use Illuminate\Http\Request;

/**
 * @OA\Tag(
 *     name="Historial de Stock",
 *     description="Operaciones para consultar el historial de movimientos de stock de repuestos"
 * )
 */
class HistorialStockController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/historial-stock",
     *     operationId="getHistorialStock",
     *     tags={"Historial de Stock"},
     *     summary="Obtener historial de movimientos de stock",
     *     description="Retorna el historial de movimientos de stock con filtros opcionales por repuesto, tipo de movimiento y rango de fechas. Los resultados se ordenan por fecha de creación descendente.",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="repuesto_id",
     *         in="query",
     *         description="ID del repuesto para filtrar movimientos",
     *         required=false,
     *         @OA\Schema(
     *             type="integer",
     *             example=5
     *         )
     *     ),
     *     @OA\Parameter(
     *         name="tipo_mov",
     *         in="query",
     *         description="Tipo de movimiento para filtrar",
     *         required=false,
     *         @OA\Schema(
     *             type="string",
     *             enum={"COMPRA", "ASIGNACION_REPUESTO", "AJUSTE", "DEVOLUCION", "VENTA", "BAJA"},
     *             example="COMPRA"
     *         )
     *     ),
     *     @OA\Parameter(
     *         name="desde",
     *         in="query",
     *         description="Fecha de inicio para filtrar (formato YYYY-MM-DD)",
     *         required=false,
     *         @OA\Schema(
     *             type="string",
     *             format="date",
     *             example="2024-01-01"
     *         )
     *     ),
     *     @OA\Parameter(
     *         name="hasta",
     *         in="query",
     *         description="Fecha de fin para filtrar (formato YYYY-MM-DD)",
     *         required=false,
     *         @OA\Schema(
     *             type="string",
     *             format="date",
     *             example="2024-12-31"
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Historial obtenido exitosamente",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="repuesto_id", type="integer", example=5),
     *                 @OA\Property(property="tipo_mov", type="string", example="COMPRA"),
     *                 @OA\Property(property="cantidad", type="integer", example=10),
     *                 @OA\Property(property="stock_anterior", type="integer", example=50),
     *                 @OA\Property(property="stock_nuevo", type="integer", example=60),
     *                 @OA\Property(property="descripcion", type="string", nullable=true, example="Compra proveedor XYZ"),
     *                 @OA\Property(property="referencia_id", type="integer", nullable=true, example=15),
     *                 @OA\Property(property="referencia_type", type="string", nullable=true, example="App\\Models\\Compra"),
     *                 @OA\Property(property="created_at", type="string", format="date-time", example="2024-03-15T10:30:00.000000Z"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time", example="2024-03-15T10:30:00.000000Z"),
     *                 @OA\Property(
     *                     property="repuesto",
     *                     type="object",
     *                     @OA\Property(property="id", type="integer", example=5),
     *                     @OA\Property(property="nombre", type="string", example="Disco Duro SSD 500GB"),
     *                     @OA\Property(property="codigo", type="string", example="SSD-500-001"),
     *                     @OA\Property(property="precio_venta", type="number", format="float", example=75.50)
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="No autorizado",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Unauthenticated.")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error interno del servidor",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Error al obtener historial"),
     *             @OA\Property(property="detalle", type="string", example="Mensaje detallado del error (solo en desarrollo)")
     *         )
     *     )
     * )
     */
    public function index(Request $request)
    {
        $query = HistorialStock::with('repuesto');

        // Filtrar por repuesto
        if ($request->has('repuesto_id') && $request->repuesto_id !== null) {
            $query->where('repuesto_id', $request->repuesto_id);
        }

        // Filtrar por tipo (COMPRA, ASIGNACION_REPUESTO, AJUSTE, etc.)
        if ($request->has('tipo_mov') && $request->tipo_mov !== null) {
            $query->where('tipo_mov', $request->tipo_mov);
        }

        // Filtrar por fecha desde
        if ($request->has('desde') && $request->desde !== null) {
            $query->whereDate('created_at', '>=', $request->desde);
        }

        // Filtrar por fecha hasta
        if ($request->has('hasta') && $request->hasta !== null) {
            $query->whereDate('created_at', '<=', $request->hasta);
        }

        // Orden por fecha DESC
        $historial = $query->orderBy('created_at', 'desc')->get();

        return response()->json($historial, 200);
    }

    /**
     * @OA\Get(
     *     path="/api/historial-stock/{id}",
     *     operationId="getMovimientoHistorial",
     *     tags={"Historial de Stock"},
     *     summary="Obtener un movimiento específico del historial",
     *     description="Retorna los detalles de un movimiento específico del historial de stock por su ID",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="ID del movimiento del historial",
     *         required=true,
     *         @OA\Schema(
     *             type="integer",
     *             example=1
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Movimiento encontrado exitosamente",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="id", type="integer", example=1),
     *             @OA\Property(property="repuesto_id", type="integer", example=5),
     *             @OA\Property(property="tipo_mov", type="string", example="COMPRA"),
     *             @OA\Property(property="cantidad", type="integer", example=10),
     *             @OA\Property(property="stock_anterior", type="integer", example=50),
     *             @OA\Property(property="stock_nuevo", type="integer", example=60),
     *             @OA\Property(property="descripcion", type="string", nullable=true, example="Compra proveedor XYZ"),
     *             @OA\Property(property="referencia_id", type="integer", nullable=true, example=15),
     *             @OA\Property(property="referencia_type", type="string", nullable=true, example="App\\Models\\Compra"),
     *             @OA\Property(property="created_at", type="string", format="date-time", example="2024-03-15T10:30:00.000000Z"),
     *             @OA\Property(property="updated_at", type="string", format="date-time", example="2024-03-15T10:30:00.000000Z"),
     *             @OA\Property(
     *                 property="repuesto",
     *                 type="object",
     *                 @OA\Property(property="id", type="integer", example=5),
     *                 @OA\Property(property="nombre", type="string", example="Disco Duro SSD 500GB"),
     *                 @OA\Property(property="codigo", type="string", example="SSD-500-001"),
     *                 @OA\Property(property="precio_venta", type="number", format="float", example=75.50),
     *                 @OA\Property(property="stock_actual", type="integer", example=60)
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Movimiento no encontrado",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Movimiento no encontrado")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="No autorizado",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Unauthenticated.")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error interno del servidor",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Error al obtener movimiento"),
     *             @OA\Property(property="detalle", type="string", example="Mensaje detallado del error (solo en desarrollo)")
     *         )
     *     )
     * )
     */
    public function show($id)
    {
        $mov = HistorialStock::with('repuesto')->find($id);

        if (!$mov) {
            return response()->json(['error' => 'Movimiento no encontrado'], 404);
        }

        return response()->json($mov, 200);
    }
}