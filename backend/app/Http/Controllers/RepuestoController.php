<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Repuesto;
use App\Models\HistorialStock;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

/**
 * @OA\Tag(
 *     name="Repuestos",
 *     description="Operaciones relacionadas con la gestión de repuestos"
 * )
 */
class RepuestoController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/repuestos",
     *     summary="Obtener todos los repuestos con paginación",
     *     tags={"Repuestos"},
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
     *     @OA\Parameter(
     *         name="search",
     *         in="query",
     *         description="Término de búsqueda",
     *         required=false,
     *         @OA\Schema(type="string", example="filtro")
     *     ),
     *     @OA\Response(
     *         response=200, 
     *         description="Lista de repuestos obtenida correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Repuesto")),
     *             @OA\Property(property="current_page", type="integer", example=1),
     *             @OA\Property(property="last_page", type="integer", example=5),
     *             @OA\Property(property="per_page", type="integer", example=15),
     *             @OA\Property(property="total", type="integer", example=75),
     *             @OA\Property(property="from", type="integer", example=1),
     *             @OA\Property(property="to", type="integer", example=15)
     *         )
     *     ),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=500, description="Error al obtener los repuestos")
     * )
     */
    public function index(Request $request)
    {
        try {
            $query = Repuesto::query();

            // Búsqueda por término
            if ($request->has('search') && $request->search !== '') {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('nombre', 'LIKE', "%$search%")
                      ->orWhere('id', 'LIKE', "%$search%");
                });
            }

            // Orden
            $sort = $request->get('sort', 'id');
            $direction = $request->get('direction', 'desc');
            $query->orderBy($sort, $direction);

            // Paginación
            $perPage = $request->get('per_page', 15);
            $repuestos = $query->paginate($perPage);
            
            return response()->json($repuestos, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener los repuestos', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/repuestos/buscar",
     *     summary="Buscar repuestos por término",
     *     tags={"Repuestos"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="q",
     *         in="query",
     *         description="Término de búsqueda",
     *         required=true,
     *         @OA\Schema(type="string", example="filtro")
     *     ),
     *     @OA\Parameter(
     *         name="per_page",
     *         in="query",
     *         description="Elementos por página",
     *         required=false,
     *         @OA\Schema(type="integer", example=100)
     *     ),
     *     @OA\Response(
     *         response=200, 
     *         description="Repuestos encontrados",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Repuesto"))
     *         )
     *     ),
     *     @OA\Response(response=400, description="Término de búsqueda requerido"),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=500, description="Error al buscar repuestos")
     * )
     */
    public function buscar(Request $request)
    {
        $termino = $request->get('q');
        $perPage = $request->get('per_page', 100);

        if (!$termino) {
            return response()->json([], 200);
        }

        try {
            $repuestos = Repuesto::where(function($query) use ($termino) {
                    $query->where('nombre', 'LIKE', "%{$termino}%")
                          ->orWhere('id', 'LIKE', "%{$termino}%");
                })
                ->paginate($perPage);

            return response()->json($repuestos, 200);
        } catch (\Exception $e) {
            return response()->json([], 200);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/repuestos",
     *     summary="Crear un nuevo repuesto",
     *     tags={"Repuestos"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"nombre", "stock", "costo_base"},
     *             @OA\Property(property="nombre", type="string", example="Filtro de aceite"),
     *             @OA\Property(property="stock", type="integer", example=100),
     *             @OA\Property(property="costo_base", type="number", format="float", example=1200.50)
     *         )
     *     ),
     *     @OA\Response(
     *         response=201, 
     *         description="Repuesto creado correctamente",
     *         @OA\JsonContent(ref="#/components/schemas/Repuesto")
     *     ),
     *     @OA\Response(response=400, description="Datos inválidos"),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=500, description="Error al crear el repuesto")
     * )
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'stock' => 'required|integer|min:0',
            'costo_base' => 'required|numeric|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Datos inválidos', 'detalles' => $validator->errors()], 400);
        }

        try {
            $repuesto = Repuesto::create($validator->validated());
            return response()->json(['mensaje' => 'Repuesto creado correctamente', 'repuesto' => $repuesto], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al crear el repuesto', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/repuestos/{id}",
     *     summary="Obtener un repuesto específico",
     *     tags={"Repuestos"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del repuesto",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200, 
     *         description="Repuesto encontrado",
     *         @OA\JsonContent(ref="#/components/schemas/Repuesto")
     *     ),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=404, description="Repuesto no encontrado")
     * )
     */
    public function show(string $id)
    {
        $repuesto = Repuesto::find($id);
        if (!$repuesto) {
            return response()->json(['error' => 'Repuesto no encontrado'], 404);
        }
        return response()->json($repuesto, 200);
    }

    /**
     * @OA\Put(
     *     path="/api/repuestos/{id}",
     *     summary="Actualizar un repuesto existente",
     *     tags={"Repuestos"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del repuesto a actualizar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="nombre", type="string", example="Filtro actualizado"),
     *             @OA\Property(property="stock", type="integer", example=80),
     *             @OA\Property(property="costo_base", type="number", format="float", example=1350.00)
     *         )
     *     ),
     *     @OA\Response(
     *         response=200, 
     *         description="Repuesto actualizado correctamente",
     *         @OA\JsonContent(ref="#/components/schemas/Repuesto")
     *     ),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=404, description="Repuesto no encontrado"),
     *     @OA\Response(response=500, description="Error al actualizar el repuesto")
     * )
     */
    public function update(Request $request, string $id)
    {
        $repuesto = Repuesto::find($id);
        if (!$repuesto) {
            return response()->json(['error' => 'Repuesto no encontrado'], 404);
        }

        try {
            $repuesto->update($request->all());
            return response()->json(['mensaje' => 'Repuesto actualizado correctamente', 'repuesto' => $repuesto], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al actualizar el repuesto', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/repuestos/comprar",
     *     summary="Comprar repuestos (crea o actualiza stock)",
     *     tags={"Repuestos"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"nombre", "cantidad", "costo_base"},
     *             @OA\Property(property="nombre", type="string", example="Filtro de aceite"),
     *             @OA\Property(property="cantidad", type="integer", example=10),
     *             @OA\Property(property="costo_base", type="number", format="float", example=1200.50),
     *             @OA\Property(property="descripcion", type="string", example="Compra proveedor XYZ", nullable=true),
     *             @OA\Property(property="proveedor", type="string", example="Proveedor ABC", nullable=true)
     *         )
     *     ),
     *     @OA\Response(
     *         response=201, 
     *         description="Repuesto comprado/actualizado correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="mensaje", type="string", example="Repuesto comprado/actualizado correctamente"),
     *             @OA\Property(property="repuesto", ref="#/components/schemas/Repuesto"),
     *             @OA\Property(property="historial", type="object", description="Registro en el historial")
     *         )
     *     ),
     *     @OA\Response(response=400, description="Datos inválidos"),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=500, description="Error al procesar la compra")
     * )
     */
    public function comprar(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'cantidad' => 'required|integer|min:1',
            'costo_base' => 'required|numeric|min:0',
            'descripcion' => 'nullable|string',
            'proveedor' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Datos inválidos', 'detalles' => $validator->errors()], 400);
        }

        try {
            DB::beginTransaction();

            // Buscar si el repuesto ya existe
            $repuesto = Repuesto::where('nombre', 'LIKE', $request->nombre)->first();

            if ($repuesto) {
                // Si existe, actualizar stock y costo
                $stockAnterior = $repuesto->stock;
                $repuesto->stock += $request->cantidad;
                
                // Actualizar costo base si es necesario (promedio ponderado)
                if ($request->costo_base > 0) {
                    $nuevoCosto = (($repuesto->costo_base * $stockAnterior) + ($request->costo_base * $request->cantidad)) 
                                / ($stockAnterior + $request->cantidad);
                    $repuesto->costo_base = $nuevoCosto;
                }
                
                $repuesto->save();
                $mensaje = 'Stock actualizado correctamente';
            } else {
                // Si no existe, crear nuevo repuesto
                $repuesto = Repuesto::create([
                    'nombre' => $request->nombre,
                    'stock' => $request->cantidad,
                    'costo_base' => $request->costo_base
                ]);
                $stockAnterior = 0;
                $mensaje = 'Repuesto creado correctamente';
            }

            // Registrar en el historial de stock
            $historial = HistorialStock::create([
                'repuesto_id' => $repuesto->id,
                'tipo_mov' => 'COMPRA',
                'cantidad' => $request->cantidad,
                'stock_anterior' => $stockAnterior,
                'stock_nuevo' => $repuesto->stock,
                'descripcion' => $request->descripcion ?? "Compra: {$request->cantidad} unidades" . 
                    ($request->proveedor ? " - Proveedor: {$request->proveedor}" : ""),
                'referencia_type' => 'App\Models\Compra',
                'created_at' => now()
            ]);

            DB::commit();

            return response()->json([
                'mensaje' => $mensaje,
                'repuesto' => $repuesto,
                'historial' => $historial
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al procesar la compra', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/repuestos/{id}",
     *     summary="Eliminar un repuesto",
     *     tags={"Repuestos"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del repuesto a eliminar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Repuesto eliminado correctamente"),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=404, description="Repuesto no encontrado"),
     *     @OA\Response(response=500, description="Error al eliminar el repuesto")
     * )
     */
    public function destroy(string $id)
    {
        $repuesto = Repuesto::find($id);
        if (!$repuesto) {
            return response()->json(['error' => 'Repuesto no encontrado'], 404);
        }

        try {
            $repuesto->delete();
            return response()->json(['mensaje' => 'Repuesto eliminado correctamente'], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al eliminar el repuesto', 'detalle' => $e->getMessage()], 500);
        }
    }
}