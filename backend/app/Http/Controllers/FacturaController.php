<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use App\Models\Factura;
use App\Models\Presupuesto;

/**
 * @OA\Tag(
 *     name="Facturas",
 *     description="Operaciones relacionadas con la gestión de facturas"
 * )
 */
class FacturaController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/factura",
     *     summary="Listar facturas con paginación y búsqueda",
     *     tags={"Facturas"},
     *     @OA\Parameter(
     *         name="page",
     *         in="query",
     *         description="Número de página",
     *         required=false,
     *         @OA\Schema(type="integer", default=1)
     *     ),
     *     @OA\Parameter(
     *         name="per_page",
     *         in="query",
     *         description="Cantidad de registros por página",
     *         required=false,
     *         @OA\Schema(type="integer", default=15)
     *     ),
     *     @OA\Parameter(
     *         name="search",
     *         in="query",
     *         description="Texto de búsqueda",
     *         required=false,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Listado paginado de facturas"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error al obtener las facturas"
     *     )
     * )
     */
    public function index(Request $request)
    {
        try {
            $perPage = (int) $request->get('per_page', 15);
            $page    = (int) $request->get('page', 1);
            $search  = $request->get('search', '');

            $q = Factura::query()->orderByDesc('fecha');

            if (!empty($search)) {
                $q->where(function ($query) use ($search) {
                    $query->where('numero', 'LIKE', "%{$search}%")
                        ->orWhere('letra', 'LIKE', "%{$search}%")
                        ->orWhere('detalle', 'LIKE', "%{$search}%")
                        ->orWhere('monto_total', 'LIKE', "%{$search}%")
                        ->orWhere('presupuesto_id', 'LIKE', "%{$search}%");
                });
            }

            $facturas = $q->paginate($perPage, ['*'], 'page', $page);
            return response()->json($facturas, 200);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Error al obtener las facturas', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/factura",
     *     summary="Crear una nueva factura",
     *     tags={"Facturas"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"presupuesto_id", "numero", "letra", "monto_total"},
     *             @OA\Property(property="presupuesto_id", type="integer", example=12),
     *             @OA\Property(property="numero", type="string", example="1559"),
     *             @OA\Property(property="letra", type="string", enum={"A","B","C"}, example="A"),
     *             @OA\Property(property="monto_total", type="number", example=15000.50),
     *             @OA\Property(property="detalle", type="string", example="Reparación general")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Factura creada correctamente"
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Datos inválidos"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error al crear la factura"
     *     )
     * )
     */
    public function store(Request $request)
    {
        $table = (new Factura)->getTable();

        $validator = Validator::make($request->all(), [
            'presupuesto_id' => [
                'required',
                'exists:presupuesto,id',
                function ($attribute, $value, $fail) {
                    $facturaExistente = Factura::where('presupuesto_id', $value)->first();
                    if ($facturaExistente) {
                        $fail("El presupuesto #{$value} ya tiene una factura asignada (#{$facturaExistente->numero}{$facturaExistente->letra})");
                    }
                },
                function ($attribute, $value, $fail) {
                    $presupuesto = Presupuesto::find($value);
                    if ($presupuesto && !$presupuesto->aceptado) {
                        $fail("El presupuesto #{$value} no está aceptado");
                    }
                }
            ],
            'numero'         => ['required', 'string', 'max:50', Rule::unique($table, 'numero')],
            'letra'          => 'required|string|in:A,B,C',
            'monto_total'    => 'required|numeric|min:0',
            'detalle'        => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Datos inválidos', 'detalles' => $validator->errors()], 400);
        }

        try {
            $data = $validator->validated();

            $presupuesto = Presupuesto::with('reparacion')->find($data['presupuesto_id']);
            if ($presupuesto && $presupuesto->reparacion) {
                if (strtolower($presupuesto->reparacion->estado) !== 'finalizada') {
                    return response()->json([
                        'error' => 'No se puede facturar',
                        'detalle' => 'La reparación asociada no está finalizada'
                    ], 400);
                }
            }

            $data['fecha'] = now()->format('Y-m-d H:i:s');

            $factura = Factura::create($data);

            return response()->json([
                'mensaje' => 'Factura creada correctamente',
                'factura' => $factura
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Error al crear la factura',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * @OA\Get(
     *     path="/api/factura/{id}",
     *     summary="Obtener una factura por ID",
     *     tags={"Facturas"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID de la factura",
     *         @OA\Schema(type="integer", example=12)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Factura encontrada"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Factura no encontrada"
     *     )
     * )
     */
    public function show($id)
    {
        $factura = Factura::find($id);
        if (!$factura) return response()->json(['error' => 'Factura no encontrada'], 404);
        $factura->load('cobros');
        return response()->json($factura, 200);
    }


    /**
     * @OA\Put(
     *     path="/api/factura/{id}",
     *     summary="Actualizar una factura",
     *     tags={"Facturas"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID de la factura a actualizar",
     *         @OA\Schema(type="integer", example=12)
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="presupuesto_id", type="integer", example=5),
     *             @OA\Property(property="numero", type="string", example="FAC-2025-001"),
     *             @OA\Property(property="letra", type="string", enum={"A","B","C"}, example="A"),
     *             @OA\Property(property="fecha", type="string", format="date-time", example="2025-11-20 14:30:00"),
     *             @OA\Property(property="monto_total", type="number", format="float", example=25000.75),
     *             @OA\Property(property="detalle", type="string", example="Reparación general y limpieza")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Factura actualizada correctamente"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Factura no encontrada"
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Datos inválidos"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error al actualizar la factura"
     *     )
     * )
     */
    public function update(Request $request, $id)
        {
            $factura = Factura::find($id);
            if (!$factura) return response()->json(['error' => 'Factura no encontrada'], 404);

            $table = (new Factura)->getTable();

            $validator = Validator::make($request->all(), [
                'presupuesto_id' => [
                    'sometimes',
                    'required',
                    'exists:presupuesto,id',
                    function ($attribute, $value, $fail) use ($id) {
                        $facturaExistente = Factura::where('presupuesto_id', $value)
                            ->where('id', '!=', $id)
                            ->first();
                        if ($facturaExistente) {
                            $fail("El presupuesto #{$value} ya tiene una factura asignada (#{$facturaExistente->numero}{$facturaExistente->letra})");
                        }
                    },
                    function ($attribute, $value, $fail) {
                        $presupuesto = Presupuesto::find($value);
                        if ($presupuesto && !$presupuesto->aceptado) {
                            $fail("El presupuesto #{$value} no está aceptado");
                        }
                    }
                ],
                'numero'         => ['sometimes', 'required', 'string', 'max:50', Rule::unique($table, 'numero')->ignore($id)],
                'letra'          => 'sometimes|required|string|in:A,B,C',
                'fecha'          => 'sometimes|required|date',
                'monto_total'    => 'sometimes|required|numeric|min:0',
                'detalle'        => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json(['error' => 'Datos inválidos', 'detalles' => $validator->errors()], 400);
            }

            try {
                $data = $validator->validated();

                if (isset($data['presupuesto_id']) && $data['presupuesto_id'] != $factura->presupuesto_id) {
                    $presupuesto = Presupuesto::with('reparacion')->find($data['presupuesto_id']);
                    if ($presupuesto && $presupuesto->reparacion) {
                        if (strtolower($presupuesto->reparacion->estado) !== 'finalizada') {
                            return response()->json([
                                'error' => 'No se puede actualizar',
                                'detalle' => 'La reparación asociada no está finalizada'
                            ], 400);
                        }
                    }
                }

                if (array_key_exists('fecha', $data) && $data['fecha']) {
                    $data['fecha'] = Carbon::parse($data['fecha'])->format('Y-m-d H:i:s');
                }

                $factura->update($data);

                return response()->json([
                    'mensaje' => 'Factura actualizada correctamente',
                    'factura' => $factura
                ], 200);
            } catch (\Throwable $e) {
                return response()->json([
                    'error'   => 'Error al actualizar la factura',
                    'detalle' => $e->getMessage()
                ], 500);
            }
    }

    /**
     * @OA\Delete(
     *     path="/api/factura/{id}",
     *     summary="Eliminar una factura",
     *     tags={"Facturas"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID de la factura a eliminar",
     *         @OA\Schema(type="integer", example=12)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Factura eliminada correctamente"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Factura no encontrada"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error al eliminar la factura"
     *     )
     * )
     */
    public function destroy($id)
    {
        $factura = Factura::find($id);
        if (!$factura) return response()->json(['error' => 'Factura no encontrada'], 404);

        try {
            $factura->delete();
            return response()->json(['mensaje' => 'Factura eliminada correctamente'], 200);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Error al eliminar la factura', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * Obtener el monto total y el saldo pendiente de una factura específica.
     * Endpoint: GET /api/facturas/{id}/saldo
     * * @OA\Get(
     * path="/api/facturas/{id}/saldo",
     * summary="Obtener saldo pendiente de una factura",
     * tags={"Facturas", "Cobros"},
     * @OA\Parameter(name="id", in="path", required=true, description="ID de la factura", @OA\Schema(type="integer")),
     * @OA\Response(
     * response=200, 
     * description="Saldo pendiente calculado",
     * @OA\JsonContent(
     * @OA\Property(property="monto_total", type="number", example=15000.50),
     * @OA\Property(property="saldo_pendiente", type="number", example=5000.50)
     * )
     * ),
     * @OA\Response(response=404, description="Factura no encontrada")
     * )
     */
    public function getSaldoPendiente($id)
    {
        try {
            $factura = Factura::with('cobros')->findOrFail($id);

            $saldo = $factura->getSaldoPendienteAttribute();

            return response()->json([
                'monto_total' => $factura->monto_total,
                'saldo_pendiente' => $saldo
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Factura no encontrada o error de cálculo', 'detalle' => $e->getMessage()], 404);
        }
    }


    /**
     * Obtener el historial de cobros (pagos) realizados a una factura específica.
     * Endpoint: GET /api/facturas/{id}/cobros
     * * @OA\Get(
     * path="/api/facturas/{id}/cobros",
     * summary="Obtener historial de cobros de una factura",
     * tags={"Facturas", "Cobros"},
     * @OA\Parameter(name="id", in="path", required=true, description="ID de la factura", @OA\Schema(type="integer")),
     * @OA\Response(response=200, description="Historial de cobros", @OA\JsonContent(type="array", @OA\Items(ref="#/components/schemas/Cobro"))),
     * @OA\Response(response=404, description="Factura no encontrada")
     * )
     */
    public function getCobrosPorFactura($id)
    {
        try {
            $factura = Factura::findOrFail($id);

            $cobros = $factura->cobros()->with('detalles.medioCobro')->orderByDesc('fecha')->get();

            return response()->json($cobros, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Factura no encontrada o error al obtener cobros', 'detalle' => $e->getMessage()], 404);
        }
    }
}
