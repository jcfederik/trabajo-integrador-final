<?php

namespace App\Http\Controllers;

use App\Models\Factura;
use App\Models\Presupuesto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * @OA\Tag(
 *     name="Facturas",
 *     description="Operaciones relacionadas con la facturación"
 * )
 */
class FacturaController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/facturas",
     *     summary="Obtener todas las facturas con paginación",
     *     tags={"Facturas"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="page",
     *         in="query",
     *         description="Número de página",
     *         required=false,
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *     @OA\Parameter(
     *         name="per_page",
     *         in="query",
     *         description="Elementos por página",
     *         required=false,
     *         @OA\Schema(type="integer", example=15)
     *     ),
     *     @OA\Response(
     *         response=200, 
     *         description="Lista de facturas obtenida correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Factura")),
     *             @OA\Property(property="current_page", type="integer", example=1),
     *             @OA\Property(property="last_page", type="integer", example=5),
     *             @OA\Property(property="per_page", type="integer", example=15),
     *             @OA\Property(property="total", type="integer", example=75),
     *             @OA\Property(property="from", type="integer", example=1),
     *             @OA\Property(property="to", type="integer", example=15)
     *         )
     *     ),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=500, description="Error al obtener las facturas")
     * )
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 15);
            $page = $request->get('page', 1);
            
            $facturas = Factura::with('presupuesto')->paginate($perPage, ['*'], 'page', $page);
            return response()->json($facturas, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener las facturas', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/facturas",
     *     summary="Crear una nueva factura",
     *     tags={"Facturas"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"presupuesto_id", "numero", "letra", "fecha", "monto_total"},
     *             @OA\Property(property="presupuesto_id", type="integer", example=3),
     *             @OA\Property(property="numero", type="string", example="F0001-00001234"),
     *             @OA\Property(property="letra", type="string", example="B"),
     *             @OA\Property(property="fecha", type="string", format="date-time", example="2025-10-11T15:00:00Z"),
     *             @OA\Property(property="monto_total", type="number", example=18999.99),
     *             @OA\Property(property="detalle", type="string", example="Factura generada tras aceptar presupuesto.")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201, 
     *         description="Factura creada correctamente",
     *         @OA\JsonContent(ref="#/components/schemas/Factura")
     *     ),
     *     @OA\Response(response=400, description="Datos inválidos"),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=500, description="Error al crear la factura")
     * )
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'presupuesto_id' => 'required|exists:presupuesto,id',
            'numero' => 'required|string|unique:factura,numero',
            'letra' => 'required|string|max:1',
            'fecha' => 'required|date',
            'monto_total' => 'required|numeric|min:0',
            'detalle' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Datos inválidos', 'detalles' => $validator->errors()], 400);
        }

        try {
            $factura = Factura::create($validator->validated());
            return response()->json(['mensaje' => 'Factura creada correctamente', 'factura' => $factura], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al crear la factura', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/facturas/{id}",
     *     summary="Obtener una factura específica",
     *     tags={"Facturas"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID de la factura",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200, 
     *         description="Factura encontrada",
     *         @OA\JsonContent(ref="#/components/schemas/Factura")
     *     ),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=404, description="Factura no encontrada")
     * )
     */
    public function show($id)
    {
        $factura = Factura::with('presupuesto')->find($id);
        if (!$factura) {
            return response()->json(['error' => 'Factura no encontrada'], 404);
        }
        return response()->json($factura, 200);
    }

    /**
     * @OA\Put(
     *     path="/api/facturas/{id}",
     *     summary="Actualizar una factura existente",
     *     tags={"Facturas"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID de la factura a actualizar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="numero", type="string", example="F0001-00004567"),
     *             @OA\Property(property="letra", type="string", example="A"),
     *             @OA\Property(property="fecha", type="string", format="date-time", example="2025-10-11T18:30:00Z"),
     *             @OA\Property(property="monto_total", type="number", example=22000.00),
     *             @OA\Property(property="detalle", type="string", example="Factura actualizada con nuevos datos")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200, 
     *         description="Factura actualizada correctamente",
     *         @OA\JsonContent(ref="#/components/schemas/Factura")
     *     ),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=404, description="Factura no encontrada"),
     *     @OA\Response(response=500, description="Error al actualizar la factura")
     * )
     */
    public function update(Request $request, $id)
    {
        $factura = Factura::find($id);
        if (!$factura) {
            return response()->json(['error' => 'Factura no encontrada'], 404);
        }

        $factura->update($request->all());
        return response()->json(['mensaje' => 'Factura actualizada correctamente', 'factura' => $factura], 200);
    }

    /**
     * @OA\Delete(
     *     path="/api/facturas/{id}",
     *     summary="Eliminar una factura",
     *     tags={"Facturas"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID de la factura a eliminar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Factura eliminada correctamente"),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=404, description="Factura no encontrada"),
     *     @OA\Response(response=500, description="Error al eliminar la factura")
     * )
     */
    public function destroy($id)
    {
        $factura = Factura::find($id);
        if (!$factura) {
            return response()->json(['error' => 'Factura no encontrada'], 404);
        }

        try {
            $factura->delete();
            return response()->json(['mensaje' => 'Factura eliminada correctamente'], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al eliminar la factura', 'detalle' => $e->getMessage()], 500);
        }
    }
}