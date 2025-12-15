<?php

namespace App\Http\Controllers;

use App\Models\CompraRepuesto;
use App\Models\Repuesto;
use App\Models\HistorialStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

/**
 * @OA\Tag(
 *     name="Compra de Repuestos",
 *     description="Operaciones relacionadas con la gestión de compras de repuestos"
 * )
 */
class CompraRepuestoController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/compra-repuestos",
     *     operationId="getComprasRepuestos",
     *     tags={"Compra de Repuestos"},
     *     summary="Listar todas las compras de repuestos",
     *     description="Retorna una lista completa de todas las compras de repuestos con sus relaciones (proveedor y repuesto)",
     *     security={{"bearerAuth": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Lista de compras obtenida exitosamente",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="proveedor_id", type="integer", example=5),
     *                 @OA\Property(property="repuesto_id", type="integer", example=10),
     *                 @OA\Property(property="numero_comprobante", type="string", example="FAC-001-2024"),
     *                 @OA\Property(property="cantidad", type="integer", example=20),
     *                 @OA\Property(property="precio_unitario", type="number", format="float", example=45.75),
     *                 @OA\Property(property="total", type="number", format="float", example=915.00),
     *                 @OA\Property(property="estado", type="string", example="procesado"),
     *                 @OA\Property(property="user_id", type="integer", example=1),
     *                 @OA\Property(property="created_at", type="string", format="date-time", example="2024-03-15T10:30:00.000000Z"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time", example="2024-03-15T10:30:00.000000Z"),
     *                 @OA\Property(
     *                     property="proveedor",
     *                     type="object",
     *                     @OA\Property(property="id", type="integer", example=5),
     *                     @OA\Property(property="nombre", type="string", example="Proveedor Tecnológico S.A."),
     *                     @OA\Property(property="telefono", type="string", example="+541134567890")
     *                 ),
     *                 @OA\Property(
     *                     property="repuesto",
     *                     type="object",
     *                     @OA\Property(property="id", type="integer", example=10),
     *                     @OA\Property(property="nombre", type="string", example="Memoria RAM 8GB DDR4"),
     *                     @OA\Property(property="codigo", type="string", example="RAM-8G-DDR4"),
     *                     @OA\Property(property="stock_actual", type="integer", example=50)
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
     *             @OA\Property(property="error", type="string", example="Error al obtener las compras de repuestos"),
     *             @OA\Property(property="detalle", type="string", example="Mensaje detallado del error")
     *         )
     *     )
     * )
     */
    public function index()
    {
        try {
            $compraRepuestos = CompraRepuesto::with(['proveedor', 'repuesto'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($compraRepuestos, 200);

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al obtener las compras de repuestos',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/compra-repuestos",
     *     operationId="createCompraRepuesto",
     *     tags={"Compra de Repuestos"},
     *     summary="Crear nueva compra de repuesto",
     *     description="Crea una nueva compra de repuesto, actualiza automáticamente el stock del repuesto y registra el movimiento en el historial",
     *     security={{"bearerAuth": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         description="Datos de la compra de repuesto",
     *         @OA\JsonContent(
     *             required={"proveedor_id", "repuesto_id", "numero_comprobante", "cantidad", "total", "estado"},
     *             @OA\Property(property="proveedor_id", type="integer", example=5),
     *             @OA\Property(property="repuesto_id", type="integer", example=10),
     *             @OA\Property(property="numero_comprobante", type="string", maxLength=50, example="FAC-001-2024"),
     *             @OA\Property(property="cantidad", type="integer", minimum=1, example=20),
     *             @OA\Property(property="precio_unitario", type="number", format="float", minimum=0, example=45.75),
     *             @OA\Property(property="total", type="number", format="float", minimum=0, example=915.00),
     *             @OA\Property(
     *                 property="estado", 
     *                 type="string", 
     *                 enum={"pendiente", "procesado", "cancelado"}, 
     *                 example="procesado"
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Compra creada exitosamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="mensaje", type="string", example="Compra creada correctamente"),
     *             @OA\Property(
     *                 property="compraRepuesto",
     *                 ref="#/components/schemas/CompraRepuesto"
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Datos de entrada inválidos",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Datos inválidos"),
     *             @OA\Property(
     *                 property="detalles",
     *                 type="object",
     *                 additionalProperties=true
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
     *             @OA\Property(property="error", type="string", example="Error al crear la compra de repuesto"),
     *             @OA\Property(property="detalle", type="string", example="Mensaje detallado del error")
     *         )
     *     )
     * )
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'proveedor_id'       => 'required|exists:proveedor,id',
            'repuesto_id'        => 'required|exists:repuesto,id',
            'numero_comprobante' => 'required|string|max:50|unique:compra_repuesto,numero_comprobante',
            'cantidad'           => 'required|integer|min:1',
            'precio_unitario'    => 'nullable|numeric|min:0',
            'total'              => 'required|numeric|min:0',
            'estado'             => 'required|in:pendiente,procesado,cancelado'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error'    => 'Datos inválidos',
                'detalles' => $validator->errors()
            ], 400);
        }

        try {
            $compra = DB::transaction(function () use ($validator) {
                $data = $validator->validated();

                if (empty($data['precio_unitario']) && $data['cantidad'] > 0) {
                    $data['precio_unitario'] = $data['total'] / $data['cantidad'];
                }

                $data['user_id'] = Auth::id();

                $compra = CompraRepuesto::create($data);

                $repuesto = Repuesto::findOrFail($data['repuesto_id']);
                $stockAnterior = $repuesto->stock;
                $repuesto->stock += $data['cantidad'];
                $repuesto->save();

                HistorialStock::create([
                    'repuesto_id'    => $repuesto->id,
                    'tipo_mov'       => 'COMPRA',
                    'cantidad'       => $data['cantidad'],
                    'stock_anterior' => $stockAnterior,
                    'stock_nuevo'    => $repuesto->stock,
                    'origen_id'      => $compra->id,
                    'origen_tipo'    => 'compra_repuesto',
                    'user_id'        => $data['user_id'],
                ]);

                return $compra->load(['proveedor', 'repuesto']);
            });

            return response()->json([
                'mensaje'        => 'Compra creada correctamente',
                'compraRepuesto' => $compra
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al crear la compra de repuesto',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/compra-repuestos/{id}",
     *     operationId="getCompraRepuestoById",
     *     tags={"Compra de Repuestos"},
     *     summary="Obtener una compra específica",
     *     description="Retorna los detalles de una compra de repuesto específica por su ID",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="ID de la compra de repuesto",
     *         required=true,
     *         @OA\Schema(
     *             type="integer",
     *             example=1
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Compra encontrada exitosamente",
     *         @OA\JsonContent(ref="#/components/schemas/CompraRepuesto")
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Compra no encontrada",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Compra no encontrada")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="No autorizado",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Unauthenticated.")
     *         )
     *     )
     * )
     */
    public function show(string $id)
    {
        $compra = CompraRepuesto::with(['proveedor', 'repuesto'])->find($id);

        if (!$compra) {
            return response()->json(['error' => 'Compra no encontrada'], 404);
        }

        return response()->json($compra, 200);
    }

    /**
     * @OA\Put(
     *     path="/api/compra-repuestos/{id}",
     *     operationId="updateCompraRepuesto",
     *     tags={"Compra de Repuestos"},
     *     summary="Actualizar una compra existente",
     *     description="Actualiza los datos de una compra de repuesto existente. NOTA: No se permite cambiar la cantidad ya que esto alteraría el stock.",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="ID de la compra de repuesto a actualizar",
     *         required=true,
     *         @OA\Schema(
     *             type="integer",
     *             example=1
     *         )
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         description="Datos a actualizar de la compra",
     *         @OA\JsonContent(
     *             @OA\Property(property="numero_comprobante", type="string", maxLength=50, example="FAC-001-2024-CORR"),
     *             @OA\Property(property="total", type="number", format="float", minimum=0, example=920.00),
     *             @OA\Property(
     *                 property="estado", 
     *                 type="string", 
     *                 enum={"pendiente", "procesado", "cancelado"}, 
     *                 example="procesado"
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Compra actualizada exitosamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="mensaje", type="string", example="Compra actualizada correctamente"),
     *             @OA\Property(
     *                 property="compraRepuesto",
     *                 ref="#/components/schemas/CompraRepuesto"
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Datos de entrada inválidos",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Datos inválidos"),
     *             @OA\Property(
     *                 property="detalles",
     *                 type="object",
     *                 additionalProperties=true
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Compra no encontrada",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Compra no encontrada")
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
     *             @OA\Property(property="error", type="string", example="Error al actualizar la compra"),
     *             @OA\Property(property="detalle", type="string", example="Mensaje detallado del error")
     *         )
     *     )
     * )
     */
    public function update(Request $request, string $id)
    {
        $compra = CompraRepuesto::find($id);

        if (!$compra) {
            return response()->json(['error' => 'Compra no encontrada'], 404);
        }

        $validator = Validator::make($request->all(), [
            'numero_comprobante' => 'sometimes|string|max:50|unique:compra_repuesto,numero_comprobante,' . $compra->id,
            'total'              => 'sometimes|numeric|min:0',
            'estado'             => 'sometimes|in:pendiente,procesado,cancelado'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error'    => 'Datos inválidos',
                'detalles' => $validator->errors()
            ], 400);
        }

        try {
            $compra->update($validator->validated());

            return response()->json([
                'mensaje'        => 'Compra actualizada correctamente',
                'compraRepuesto' => $compra->load(['proveedor', 'repuesto'])
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al actualizar la compra',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/compra-repuestos/{id}",
     *     operationId="deleteCompraRepuesto",
     *     tags={"Compra de Repuestos"},
     *     summary="Eliminar una compra de repuesto",
     *     description="Elimina una compra de repuesto del sistema. NOTA: Esta operación no ajusta el stock del repuesto asociado.",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="ID de la compra de repuesto a eliminar",
     *         required=true,
     *         @OA\Schema(
     *             type="integer",
     *             example=1
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Compra eliminada exitosamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="mensaje", type="string", example="Compra eliminada correctamente")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Compra no encontrada",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Compra no encontrada")
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
     *             @OA\Property(property="error", type="string", example="Error al eliminar la compra"),
     *             @OA\Property(property="detalle", type="string", example="Mensaje detallado del error")
     *         )
     *     )
     * )
     */
    public function destroy(string $id)
    {
        $compra = CompraRepuesto::find($id);

        if (!$compra) {
            return response()->json(['error' => 'Compra no encontrada'], 404);
        }

        try {
            $compra->delete();
            return response()->json(['mensaje' => 'Compra eliminada correctamente'], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al eliminar la compra',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }
}