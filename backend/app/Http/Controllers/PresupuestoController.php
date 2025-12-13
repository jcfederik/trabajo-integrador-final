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
            $perPage = (int) $request->get('per_page', 15);
            $page = (int) $request->get('page', 1);
            $search = $request->get('search', '');

            $query = Presupuesto::query();

            if (!empty($search)) {

                $query->where(function($q) use ($search) {

                    $q->where('id', 'LIKE', "%{$search}%")
                    ->orWhere('monto_total', 'LIKE', "%{$search}%")
                    ->orWhere('fecha', 'LIKE', "%{$search}%")
                    ->orWhereRaw("IF(aceptado=1,'aceptado','pendiente') LIKE ?", ["%{$search}%"]);

                    // Reparación
                    $q->orWhereHas('reparacion', function($q2) use ($search) {
                        $q2->where('descripcion', 'LIKE', "%{$search}%")
                        ->orWhere('estado', 'LIKE', "%{$search}%");
                    });

                    // Equipo
                    $q->orWhereHas('reparacion.equipo', function($q3) use ($search) {
                        $q3->where('descripcion', 'LIKE', "%{$search}%");
                    });

                    // Cliente
                    $q->orWhereHas('reparacion.equipo.cliente', function($q4) use ($search) {
                        $q4->where('nombre', 'LIKE', "%{$search}%")
                        ->orWhere('telefono', 'LIKE', "%{$search}%");
                    });

                    // Técnico
                    $q->orWhereHas('reparacion.tecnico', function($q5) use ($search) {
                        $q5->where('nombre', 'LIKE', "%{$search}%");
                    });

                });

                // Asegurar que cargue todas las relaciones
                $query->with([
                    'reparacion:id,descripcion,equipo_id,usuario_id,fecha,estado',
                    'reparacion.equipo:id,descripcion,cliente_id',
                    'reparacion.equipo.cliente:id,nombre,telefono,email',
                    'reparacion.tecnico:id,nombre'
                ]);

            } else {
                $query->with([
                    'reparacion:id,descripcion,equipo_id,usuario_id,fecha,estado',
                    'reparacion.equipo:id,descripcion,cliente_id',
                    'reparacion.equipo.cliente:id,nombre,telefono,email',
                    'reparacion.tecnico:id,nombre'
                ]);
            }


            // Ordenar por ID descendente
            $presupuestos = $query->orderBy('id', 'desc')
                                ->paginate($perPage, ['*'], 'page', $page);

            return response()->json($presupuestos, 200);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Error al obtener los presupuestos',
                'detalle' => $e->getMessage()
            ], 500);
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
     *             @OA\Property(property="fecha", type="string", format="date", example="2025-10-11")
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
            // Formatear fecha correctamente
            $data['fecha'] = Carbon::parse($data['fecha'])->format('Y-m-d H:i:s');

            $presupuesto = Presupuesto::create($data);
            
            // Cargar relaciones para la respuesta
            $presupuesto->load(['reparacion' => function($query) {
                $query->select('id', 'descripcion', 'equipo_id', 'usuario_id', 'fecha', 'estado');
            }]);
            
            return response()->json([
                'mensaje' => 'Presupuesto creado correctamente', 
                'presupuesto' => $presupuesto
            ], 201);
        } catch (\Throwable $e) {
            \Log::error('Error creando presupuesto', ['err' => $e->getMessage()]);
            return response()->json([
                'error' => 'Error al crear el presupuesto', 
                'detalle' => $e->getMessage()
            ], 500);
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
        try {
            $presupuesto = Presupuesto::with(['reparacion' => function($query) {
                $query->select('id', 'descripcion', 'equipo_id', 'usuario_id', 'fecha', 'estado');
            }])->find($id);
            
            if (!$presupuesto) {
                return response()->json(['error' => 'Presupuesto no encontrado'], 404);
            }
            return response()->json($presupuesto, 200);
        } catch (\Throwable $e) {
            \Log::error('Error mostrando presupuesto', ['err' => $e->getMessage()]);
            return response()->json([
                'error' => 'Error al obtener el presupuesto',
                'detalle' => $e->getMessage()
            ], 500);
        }
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
            \Log::info('=== INICIO BÚSQUEDA PRESUPUESTOS ===', $request->all());
            
            $termino = $request->get('q');
            $perPage = $request->get('per_page', 50);
            $soloAceptados = $request->get('aceptado', false);
            
            if (!$termino || trim($termino) === '') {
                return response()->json([], 200);
            }

            $termino = trim($termino);
            
            $query = Presupuesto::query();
                        
            $query->with(['reparacion' => function($q) {
                $q->select('id', 'descripcion', 'equipo_id', 'usuario_id', 'estado', 'fecha')
                ->with(['equipo' => function($q) {
                    $q->select('id', 'descripcion', 'cliente_id')
                        ->with(['cliente' => function($q) {
                            $q->select('id', 'nombre', 'telefono', 'email');
                        }]);
                }]);
            }]);
            
            // COMENTA temporalmente este filtro para probar
            // if ($soloAceptados) {
            //     $query->where('aceptado', true);
            // }
            
            // Primero intentar búsqueda por fecha
            $esBusquedaPorFecha = $this->agregarBusquedaPorFecha($query, $termino);
                        
            if (!$esBusquedaPorFecha) {
                
                $query->where(function($q) use ($termino) {
                    $terminoLower = strtolower($termino);
                    
                    $q->where('id', 'LIKE', "%{$termino}%");
                    
                    $q->orWhere('monto_total', 'LIKE', "%{$termino}%");
                    
                    if (str_contains($terminoLower, 'aceptado')) {
                        $q->orWhere('aceptado', true);
                    } elseif (str_contains($terminoLower, 'pendiente')) {
                        $q->orWhere('aceptado', false);
                    }
                    
                    $q->orWhereHas('reparacion', function($q2) use ($termino) {
                        $q2->where('descripcion', 'LIKE', "%{$termino}%")
                        ->orWhere('estado', 'LIKE', "%{$termino}%");
                    });
                    
                    $q->orWhereHas('reparacion.equipo', function($q3) use ($termino) {
                        $q3->where('descripcion', 'LIKE', "%{$termino}%");
                    });
                    
                    $q->orWhereHas('reparacion.equipo.cliente', function($q4) use ($termino) {
                        $q4->where('nombre', 'LIKE', "%{$termino}%");
                    });
                });
            }
                        
            $presupuestos = $query->orderBy('id', 'desc')
                ->limit($perPage)
                ->get();
            
            return response()->json($presupuestos->toArray(), 200);
            
        } catch (\Exception $e) {
            return response()->json([], 200);
        }
    }    
private function agregarBusquedaPorFecha($query, $termino)
    {
        try {
            $fecha = Carbon::createFromFormat('Y-m-d', $termino);
            $query->whereDate('fecha', $fecha->format('Y-m-d'));
            return true;
        } catch (\Exception $e1) {
            try {
                $fecha = Carbon::createFromFormat('d/m/Y', $termino);
                $query->whereDate('fecha', $fecha->format('Y-m-d'));
                return true;
            } catch (\Exception $e2) {
                if (is_numeric($termino) && strlen($termino) == 4) {
                    $query->whereYear('fecha', $termino);
                    return true;
                }
            }
        }
        return false;
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
     *             @OA\Property(property="reparacion_id", type="integer", example=5),
     *             @OA\Property(property="monto_total", type="number", example=15000.00),
     *             @OA\Property(property="aceptado", type="boolean", example=false),
     *             @OA\Property(property="fecha", type="string", format="date", example="2025-10-12")
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
            
            $presupuesto->load(['reparacion' => function($query) {
                $query->select('id', 'descripcion', 'equipo_id', 'usuario_id', 'fecha', 'estado');
            }]);
            
            return response()->json([
                'mensaje' => 'Presupuesto actualizado correctamente', 
                'presupuesto' => $presupuesto
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Error al actualizar el presupuesto', 
                'detalle' => $e->getMessage()
            ], 500);
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
            return response()->json([
                'error' => 'Error al eliminar el presupuesto', 
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

public function listadoOptimizado(Request $request)
{
    try {

        $query = Presupuesto::with([
            'reparacion:id,descripcion,equipo_id,usuario_id,fecha,estado',
            'reparacion.equipo:id,descripcion,cliente_id,marca,modelo,nro_serie',
            'reparacion.equipo.cliente:id,nombre,telefono,email',
            'reparacion.tecnico:id,nombre' 
        ]);

        if ($request->filled('search')) {
            $search = $request->search;
            
            $query->where(function ($q) use ($search) {
                $q->where('id', 'LIKE', "%$search%")
                  ->orWhere('monto_total', 'LIKE', "%$search%")
                  ->orWhere('fecha', 'LIKE', "%$search%")
                  ->orWhere('aceptado', $search === 'aceptado' ? 1 : ($search === 'pendiente' ? 0 : null));
                
                $q->orWhereHas('reparacion', function ($q) use ($search) {
                    $q->where('descripcion', 'LIKE', "%$search%")
                      ->orWhere('estado', 'LIKE', "%$search%");
                });
                
                $q->orWhereHas('reparacion.equipo', function ($q) use ($search) {
                    $q->where('descripcion', 'LIKE', "%$search%")
                      ->orWhere('marca', 'LIKE', "%$search%")
                      ->orWhere('modelo', 'LIKE', "%$search%")
                      ->orWhere('nro_serie', 'LIKE', "%$search%");
                });
                
                $q->orWhereHas('reparacion.equipo.cliente', function ($q) use ($search) {
                    $q->where('nombre', 'LIKE', "%$search%")
                      ->orWhere('telefono', 'LIKE', "%$search%")
                      ->orWhere('email', 'LIKE', "%$search%");
                });
                
                $q->orWhereHas('reparacion.tecnico', function ($q) use ($search) {
                    $q->where('nombre', 'LIKE', "%$search%")
                      ->orWhere('tipo', 'LIKE', "%$search%");
                });
            });
        }

        $query->orderBy('id', 'desc');

        $perPage = min($request->input('per_page', 20), 100);
        $presupuestos = $query->paginate($perPage, [
            'id', 'reparacion_id', 'fecha', 'monto_total', 'aceptado'
        ]);

        $presupuestos->getCollection()->transform(function ($presupuesto) {
            $reparacion = $presupuesto->reparacion;
            
            if (!$reparacion) {
                return [
                    'id' => $presupuesto->id,
                    'reparacion_id' => $presupuesto->reparacion_id,
                    'fecha' => $presupuesto->fecha,
                    'monto_total' => $presupuesto->monto_total,
                    'aceptado' => (bool)$presupuesto->aceptado,
                    'reparacion' => null
                ];
            }

            $equipo = $reparacion->equipo;
            $cliente = $equipo->cliente ?? null;
            $tecnico = $reparacion->tecnico ?? null;

            return [
                'id' => $presupuesto->id,
                'reparacion_id' => $presupuesto->reparacion_id,
                'fecha' => $presupuesto->fecha,
                'monto_total' => $presupuesto->monto_total,
                'aceptado' => (bool)$presupuesto->aceptado,
                
                'reparacion' => [
                    'id' => $reparacion->id,
                    'descripcion' => $reparacion->descripcion,
                    'equipo_id' => $reparacion->equipo_id,
                    'usuario_id' => $reparacion->usuario_id,
                    'fecha' => $reparacion->fecha,
                    'estado' => $reparacion->estado,
                    
                    'equipo_nombre' => $equipo->descripcion ?? 'Sin equipo',
                    'cliente_nombre' => $cliente->nombre ?? 'No especificado',
                    'tecnico_nombre' => $tecnico->nombre ?? 'Sin técnico',
                    
                    'equipo' => $equipo ? [
                        'id' => $equipo->id,
                        'descripcion' => $equipo->descripcion,
                        'marca' => $equipo->marca,
                        'modelo' => $equipo->modelo,
                        'nro_serie' => $equipo->nro_serie,
                        'cliente_id' => $equipo->cliente_id,
                        'cliente' => $cliente ? [
                            'id' => $cliente->id,
                            'nombre' => $cliente->nombre,
                            'telefono' => $cliente->telefono,
                            'email' => $cliente->email
                        ] : null
                    ] : null,
                    
                    'tecnico' => $tecnico ? [
                        'id' => $tecnico->id,
                        'nombre' => $tecnico->nombre,
                        'tipo' => $tecnico->tipo
                    ] : null
                ]
            ];
        });

        return response()->json($presupuestos);

    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Error interno del servidor',
            'message' => $e->getMessage()
        ], 500);
    }
}


}