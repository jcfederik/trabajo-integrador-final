<?php

namespace App\Http\Controllers;

use App\Models\Cobro;
use App\Models\Factura;
use App\Models\DetalleCobro;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

/**
 * @OA\Tag(
 *     name="Cobros",
 *     description="Gestión de cobros y pagos de facturas"
 * )
 */
class CobroController extends Controller
{
    /**
     * Listar cobros con paginación
     * 
     * @OA\Get(
     *     path="/api/cobros",
     *     summary="Listar cobros paginados",
     *     description="Obtiene una lista paginada de todos los cobros registrados en el sistema",
     *     tags={"Cobros"},
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="per_page",
     *         in="query",
     *         description="Número de items por página (default: 15)",
     *         required=false,
     *         @OA\Schema(type="integer", minimum=1, maximum=100, default=15)
     *     ),
     *     @OA\Parameter(
     *         name="page",
     *         in="query",
     *         description="Número de página",
     *         required=false,
     *         @OA\Schema(type="integer", minimum=1, default=1)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Lista de cobros paginada",
     *         @OA\JsonContent(
     *             @OA\Property(property="current_page", type="integer", example=1),
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Cobro")),
     *             @OA\Property(property="first_page_url", type="string"),
     *             @OA\Property(property="from", type="integer"),
     *             @OA\Property(property="last_page", type="integer"),
     *             @OA\Property(property="last_page_url", type="string"),
     *             @OA\Property(property="links", type="array", @OA\Items(ref="#/components/schemas/PaginationLink")),
     *             @OA\Property(property="next_page_url", type="string", nullable=true),
     *             @OA\Property(property="path", type="string"),
     *             @OA\Property(property="per_page", type="integer"),
     *             @OA\Property(property="prev_page_url", type="string", nullable=true),
     *             @OA\Property(property="to", type="integer"),
     *             @OA\Property(property="total", type="integer")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error interno del servidor",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     */
    public function index(Request $request)
    {
        try {
            $perPage = (int) $request->get('per_page', 15);

            $cobros = Cobro::with(['factura', 'detalles.medioCobro'])
                ->orderByDesc('fecha')
                ->paginate($perPage);

            return response()->json($cobros, 200);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Error al obtener los cobros'], 500);
        }
    }

    /**
     * Registrar un nuevo cobro asociado a una Factura
     * 
     * @OA\Post(
     *     path="/api/cobros",
     *     summary="Registrar un nuevo cobro",
     *     description="Registra un pago/cobro para una factura específica, validando el saldo pendiente",
     *     tags={"Cobros"},
     *     security={{"bearerAuth": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         description="Datos del cobro a registrar",
     *         @OA\JsonContent(
     *             required={"factura_id", "monto_pagado", "medio_cobro_id"},
     *             @OA\Property(property="factura_id", type="integer", example=1, description="ID de la factura a la que se aplica el cobro"),
     *             @OA\Property(property="monto_pagado", type="number", format="float", example=15000.50, description="Monto del pago (debe ser positivo y no exceder el saldo pendiente)"),
     *             @OA\Property(property="medio_cobro_id", type="integer", example=1, description="ID del medio de cobro (efectivo, tarjeta, transferencia, etc.)"),
     *             @OA\Property(property="fecha", type="string", format="date-time", example="2024-01-15 14:30:00", description="Fecha y hora del cobro (opcional, por defecto usa la fecha actual)")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Cobro registrado exitosamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="mensaje", type="string", example="Cobro registrado correctamente."),
     *             @OA\Property(property="cobro", ref="#/components/schemas/Cobro"),
     *             @OA\Property(property="factura_saldo_restante", type="number", format="float", example=5000.00, description="Saldo pendiente actualizado de la factura")
     *         )
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Datos inválidos o monto excede saldo pendiente",
     *         @OA\JsonContent(
     *             oneOf={
     *                 @OA\Schema(ref="#/components/schemas/ValidationErrorResponse"),
     *                 @OA\Schema(
     *                     @OA\Property(property="error", type="string", example="El monto pagado excede el saldo pendiente de la factura."),
     *                     @OA\Property(property="saldo_pendiente", type="number", format="float", example=10000.00)
     *                 )
     *             }
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Factura o medio de cobro no encontrado",
     *         @OA\JsonContent(ref="#/components/schemas/NotFoundResponse")
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error interno del servidor",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'factura_id'     => 'required|exists:factura,id',
            'monto_pagado'   => 'required|numeric|min:0.01',
            'medio_cobro_id' => 'required|exists:medio_cobro,id',
            'fecha'          => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Datos inválidos', 'detalles' => $validator->errors()], 400);
        }

        $data = $validator->validated();
        $facturaId = $data['factura_id'];
        $montoPagado = $data['monto_pagado'];
        $fechaCobro = $data['fecha'] ?? now();

        try {
            DB::beginTransaction();

            $factura = Factura::findOrFail($facturaId);
            $saldoPendiente = $factura->getSaldoPendienteAttribute();

            if ($montoPagado > $saldoPendiente) {
                DB::rollBack();
                return response()->json([
                    'error' => 'El monto pagado excede el saldo pendiente de la factura.',
                    'saldo_pendiente' => $saldoPendiente
                ], 400);
            }

            $cobro = Cobro::create([
                'factura_id' => $facturaId,
                'monto'      => $montoPagado,
                'fecha'      => $fechaCobro,
            ]);

            $detalleCobro = DetalleCobro::create([
                'cobro_id'       => $cobro->id,
                'medio_cobro_id' => $data['medio_cobro_id'],
                'monto_pagado'   => $montoPagado,
                'fecha'          => $fechaCobro,
            ]);

            DB::commit();

            $factura->refresh();

            return response()->json([
                'mensaje' => 'Cobro registrado correctamente.',
                'cobro' => $cobro->load('detalles'),
                'factura_saldo_restante' => $factura->getSaldoPendienteAttribute()
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Error interno al registrar el cobro.',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }
}