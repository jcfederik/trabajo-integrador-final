<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Presupuesto;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

/**
 * @OA\Tag(
 *     name="Presupuestos",
 *     description="Operaciones relacionadas con la gestión de presupuestos"
 * )
 */
class PresupuestoController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/presupuestos",
     *     summary="Obtener todos los presupuestos con paginación",
     *     tags={"Presupuestos"},
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
     *         description="Lista de presupuestos obtenida correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Presupuesto")),
     *             @OA\Property(property="current_page", type="integer", example=1),
     *             @OA\Property(property="last_page", type="integer", example=5),
     *             @OA\Property(property="per_page", type="integer", example=15),
     *             @OA\Property(property="total", type="integer", example=75)
     *         )
     *     ),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=500, description="Error al obtener los presupuestos")
     * )
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 15);
            $page = $request->get('page', 1);
            
            $presupuestos = Presupuesto::paginate($perPage, ['*'], 'page', $page);
            return response()->json($presupuestos, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener los presupuestos', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/presupuestos",
     *     summary="Crear un nuevo presupuesto",
     *     tags={"Presupuestos"},
     *     security={{"bearerAuth":{}}},
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
     *     @OA\Response(
     *         response=201, 
     *         description="Presupuesto creado correctamente",
     *         @OA\JsonContent(ref="#/components/schemas/Presupuesto")
     *     ),
     *     @OA\Response(response=400, description="Datos inválidos"),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=500, description="Error al crear el presupuesto")
     * )
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'reparacion_id' => 'required|exists:reparacion,id',
            'monto_total'   => 'required|numeric|min:0',
            'aceptado'      => 'required|boolean',
            'fecha'         => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Datos inválidos', 'detalles' => $validator->errors()], 400);
        }

        try {
            $data = $validator->validated();
            $data['fecha'] = Carbon::parse($data['fecha'])->format('Y-m-d H:i:s');

            $presupuesto = Presupuesto::create($data);
            return response()->json(['mensaje' => 'Presupuesto creado correctamente', 'presupuesto' => $presupuesto], 201);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Error al crear el presupuesto', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/presupuestos/{id}",
     *     summary="Obtener un presupuesto específico",
     *     tags={"Presupuestos"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del presupuesto",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200, 
     *         description="Presupuesto encontrado",
     *         @OA\JsonContent(ref="#/components/schemas/Presupuesto")
     *     ),
     *     @OA\Response(response=401, description="No autorizado"),
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
     * @OA\Get(
     *     path="/api/presupuestos/buscar",
     *     summary="Buscar presupuestos por término",
     *     tags={"Presupuestos"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="q",
     *         in="query",
     *         description="Término de búsqueda (ID, descripción de reparación, etc.)",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Lista de presupuestos encontrados",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(ref="#/components/schemas/Presupuesto")
     *         )
     *     ),
     *     @OA\Response(response=400, description="Término de búsqueda requerido"),
     *     @OA\Response(response=401, description="No autorizado")
     * )
     */
    public function buscar(Request $request)
    {
        try {
            if (!auth()->check()) {
                return response()->json([], 200);
            }

            $termino = $request->get('q');
            
            if (!$termino || trim($termino) === '') {
                return response()->json([], 200);
            }

            $termino = trim($termino);
            
            $query = Presupuesto::query();
            
            if ($request->get('include') === 'reparacion') {
                $query->with(['reparacion.equipo', 'reparacion.tecnico']);
            } else {
                $query->with(['reparacion']);
            }
            
            $esBusquedaPorFecha = $this->agregarBusquedaPorFecha($query, $termino);
            
            if (!$esBusquedaPorFecha) {
                $query->where(function($query) use ($termino) {
                    $terminoLower = strtolower($termino);
                    
                    if (is_numeric($termino)) {
                        $query->where('id', $termino)
                            ->orWhere('monto_total', 'like', "%{$termino}%");
                    }
                    
                    $query->orWhere('monto_total', 'like', "%{$termino}%");
                    
                    $estadoBusqueda = null;
                    if (str_contains($terminoLower, 'aceptado') || str_contains($terminoLower, 'aceptada')) {
                        $estadoBusqueda = true;
                    } elseif (str_contains($terminoLower, 'pendiente')) {
                        $estadoBusqueda = false;
                    }
                    
                    if ($estadoBusqueda !== null) {
                        $query->orWhere('aceptado', $estadoBusqueda);
                    }
                })
                ->orWhereHas('reparacion', function($query) use ($termino) {
                    $query->where('descripcion', 'like', "%{$termino}%")
                        ->orWhere('estado', 'like', "%{$termino}%");
                });
            }
            
            $presupuestos = $query->orderBy('id', 'desc')
                ->limit($request->get('per_page', 50))
                ->get();
            
            return response()->json($presupuestos->toArray(), 200);
            
        } catch (\Exception $e) {
            return response()->json([], 200);
        }
    }

    private function agregarBusquedaPorFecha($query, $termino)
    {
        $formatosFecha = [
            'Y-m-d', 'd/m/Y', 'd-m-Y', 'd.m.Y', 'Y/m/d', 'm/d/Y', 'd/m/y'
        ];
        
        $fechaEncontrada = false;
        
        foreach ($formatosFecha as $formato) {
            try {
                $fecha = Carbon::createFromFormat($formato, $termino);
                if ($fecha !== false) {
                    $query->whereDate('fecha', $fecha->format('Y-m-d'));
                    $fechaEncontrada = true;
                    break;
                }
            } catch (\Exception $e) {
                continue;
            }
        }
        
        if (!$fechaEncontrada) {
            if (preg_match('/^(19|20)\d{2}[-.\/](0[1-9]|1[0-2])$/', $termino)) {
                $fecha = Carbon::createFromFormat('Y-m', str_replace(['/', '.'], '-', $termino));
                $query->whereYear('fecha', $fecha->year)
                    ->whereMonth('fecha', $fecha->month);
                $fechaEncontrada = true;
            }
            elseif (preg_match('/^(0[1-9]|1[0-2])[-.\/](19|20)\d{2}$/', $termino)) {
                $partes = preg_split('/[-.\/]/', $termino);
                $mes = $partes[0];
                $anio = $partes[1];
                $query->whereYear('fecha', $anio)
                    ->whereMonth('fecha', $mes);
                $fechaEncontrada = true;
            }
            elseif (preg_match('/^(19|20)\d{2}$/', $termino)) {
                $query->whereYear('fecha', $termino);
                $fechaEncontrada = true;
            }
        }
        
        return $fechaEncontrada;
    }

    /**
     * @OA\Put(
     *     path="/api/presupuestos/{id}",
     *     summary="Actualizar un presupuesto existente",
     *     tags={"Presupuestos"},
     *     security={{"bearerAuth":{}}},
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
     *     @OA\Response(
     *         response=200, 
     *         description="Presupuesto actualizado correctamente",
     *         @OA\JsonContent(ref="#/components/schemas/Presupuesto")
     *     ),
     *     @OA\Response(response=401, description="No autorizado"),
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
            $data = $request->all();
            if (isset($data['fecha'])) {
                $data['fecha'] = Carbon::parse($data['fecha'])->format('Y-m-d H:i:s');
            }
            $presupuesto->update($data);
            return response()->json(['mensaje' => 'Presupuesto actualizado correctamente', 'presupuesto' => $presupuesto], 200);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Error al actualizar el presupuesto', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/presupuestos/{id}",
     *     summary="Eliminar un presupuesto",
     *     tags={"Presupuestos"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del presupuesto a eliminar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Presupuesto eliminado correctamente"),
     *     @OA\Response(response=401, description="No autorizado"),
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