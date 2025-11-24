<?php

namespace App\Http\Controllers;

use App\Models\Reparacion;
use App\Models\Repuesto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * @OA\Tag(
 *     name="Reparaciones",
 *     description="Operaciones relacionadas con las reparaciones de equipos"
 * )
 */
class ReparacionController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/reparaciones",
     *     summary="Listar todas las reparaciones con paginación",
     *     tags={"Reparaciones"},
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
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Parameter(
     *         name="sort",
     *         in="query",
     *         description="Campo para ordenar",
     *         required=false,
     *         @OA\Schema(type="string", example="id")
     *     ),
     *     @OA\Parameter(
     *         name="direction",
     *         in="query",
     *         description="Dirección del orden (asc/desc)",
     *         required=false,
     *         @OA\Schema(type="string", example="desc")
     *     ),
     *     @OA\Response(
     *         response=200, 
     *         description="Lista de reparaciones obtenida correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Reparacion")),
     *             @OA\Property(property="current_page", type="integer", example=1),
     *             @OA\Property(property="last_page", type="integer", example=5),
     *             @OA\Property(property="per_page", type="integer", example=15),
     *             @OA\Property(property="total", type="integer", example=75)
     *         )
     *     ),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=500, description="Error al obtener las reparaciones")
     * )
     */
    public function index(Request $request)
    {
        $query = Reparacion::query();

        if ($request->has('search') && $request->search !== '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('id', 'LIKE', "%$search%")
                ->orWhere('descripcion', 'LIKE', "%$search%")
                ->orWhere('estado', 'LIKE', "%$search%")
                ->orWhere('fecha', 'LIKE', "%$search%");
            });
        }

        // orden
        $sort = $request->get('sort', 'id');
        $direction = $request->get('direction', 'desc');
        $query->orderBy($sort, $direction);

        // paginación
        $perPage = $request->get('size', 10);
        return $query->paginate($perPage);
    }

    /**
     * @OA\Get(
     *     path="/api/reparaciones/buscar",
     *     summary="Buscar reparaciones por término",
     *     tags={"Reparaciones"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="q",
     *         in="query",
     *         description="Término de búsqueda",
     *         required=true,
     *         @OA\Schema(type="string", example="placa madre")
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
     *         description="Reparaciones encontradas",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Reparacion"))
     *         )
     *     ),
     *     @OA\Response(response=400, description="Término de búsqueda requerido"),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=500, description="Error al buscar reparaciones")
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
            $reparaciones = Reparacion::with(['equipo', 'tecnico', 'repuestos'])
                ->where(function($query) use ($termino) {
                    $query->where('descripcion', 'LIKE', "%{$termino}%")
                          ->orWhere('estado', 'LIKE', "%{$termino}%")
                          ->orWhereHas('equipo', function($q) use ($termino) {
                              $q->where('descripcion', 'LIKE', "%{$termino}%")
                                ->orWhere('marca', 'LIKE', "%{$termino}%")
                                ->orWhere('modelo', 'LIKE', "%{$termino}%")
                                ->orWhere('nro_serie', 'LIKE', "%{$termino}%");
                          })
                          ->orWhereHas('tecnico', function($q) use ($termino) {
                              $q->where('nombre', 'LIKE', "%{$termino}%")
                                ->orWhere('email', 'LIKE', "%{$termino}%");
                          });
                })
                ->paginate($perPage);

            return response()->json($reparaciones, 200);
        } catch (\Exception $e) {
            return response()->json([], 200);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/reparaciones",
     *     summary="Registrar una nueva reparación",
     *     tags={"Reparaciones"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"equipo_id", "usuario_id", "descripcion", "fecha", "estado"},
     *             @OA\Property(property="equipo_id", type="integer", example=2),
     *             @OA\Property(property="usuario_id", type="integer", example=5),
     *             @OA\Property(property="descripcion", type="string", example="Reemplazo de placa madre"),
     *             @OA\Property(property="fecha", type="string", format="date", example="2025-10-11"),
     *             @OA\Property(property="estado", type="string", example="pendiente")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201, 
     *         description="Reparación creada correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="mensaje", type="string", example="Reparación registrada correctamente"),
     *             @OA\Property(property="reparacion", ref="#/components/schemas/Reparacion")
     *         )
     *     ),
     *     @OA\Response(response=400, description="Datos inválidos"),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=500, description="Error al crear la reparación")
     * )
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'equipo_id' => 'required|exists:equipo,id',
            'usuario_id' => 'required|exists:usuario,id',
            'descripcion' => 'required|string',
            'fecha' => 'required|date',
            'estado' => 'required|string|max:50'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Datos inválidos', 'detalles' => $validator->errors()], 400);
        }

        try {
            $reparacion = Reparacion::create($validator->validated());
            
            $reparacionConRelaciones = Reparacion::with(['equipo', 'tecnico', 'repuestos'])
                ->find($reparacion->id);
            
            return response()->json([
                'mensaje' => 'Reparación registrada correctamente', 
                'reparacion' => $reparacionConRelaciones
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al crear la reparación', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/reparaciones/{id}",
     *     summary="Mostrar una reparación específica",
     *     tags={"Reparaciones"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID de la reparación",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200, 
     *         description="Reparación encontrada",
     *         @OA\JsonContent(ref="#/components/schemas/Reparacion")
     *     ),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=404, description="Reparación no encontrada")
     * )
     */
    public function show($id)
    {
        $reparacion = Reparacion::with(['equipo', 'tecnico', 'repuestos'])->find($id);
        if (!$reparacion) {
            return response()->json(['error' => 'Reparación no encontrada'], 404);
        }
        return response()->json($reparacion, 200);
    }

    /**
     * @OA\Put(
     *     path="/api/reparaciones/{id}",
     *     summary="Actualizar una reparación existente",
     *     tags={"Reparaciones"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID de la reparación a actualizar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="equipo_id", type="integer", example=2),
     *             @OA\Property(property="usuario_id", type="integer", example=5),
     *             @OA\Property(property="descripcion", type="string", example="Cambio de disco rígido y reinstalación de sistema operativo"),
     *             @OA\Property(property="fecha", type="string", format="date", example="2025-10-11"),
     *             @OA\Property(property="estado", type="string", example="finalizada")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200, 
     *         description="Reparación actualizada correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="mensaje", type="string", example="Reparación actualizada correctamente"),
     *             @OA\Property(property="reparacion", ref="#/components/schemas/Reparacion")
     *         )
     *     ),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=404, description="Reparación no encontrada"),
     *     @OA\Response(response=500, description="Error al actualizar la reparación")
     * )
     */
    public function update(Request $request, $id)
    {
        $reparacion = Reparacion::find($id);
        if (!$reparacion) {
            return response()->json(['error' => 'Reparación no encontrada'], 404);
        }

        try {
            $reparacion->update($request->all());
            
            $reparacionActualizada = Reparacion::with(['equipo', 'tecnico', 'repuestos'])
                ->find($id);
                
            return response()->json([
                'mensaje' => 'Reparación actualizada correctamente', 
                'reparacion' => $reparacionActualizada
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al actualizar la reparación', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/reparaciones/{id}",
     *     summary="Eliminar una reparación",
     *     tags={"Reparaciones"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID de la reparación a eliminar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200, 
     *         description="Reparación eliminada correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="mensaje", type="string", example="Reparación eliminada correctamente")
     *         )
     *     ),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=404, description="Reparación no encontrada"),
     *     @OA\Response(response=500, description="Error al eliminar la reparación")
     * )
     */
    public function destroy($id)
    {
        $reparacion = Reparacion::find($id);
        if (!$reparacion) {
            return response()->json(['error' => 'Reparación no encontrada'], 404);
        }

        try {
            $reparacion->delete();
            return response()->json(['mensaje' => 'Reparación eliminada correctamente'], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al eliminar la reparación', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/reparaciones/completo",
     *     summary="Obtener lista completa de reparaciones con equipo, cliente y técnico",
     *     description="Devuelve la reparación con todas las relaciones cargadas: equipo, cliente dentro del equipo y técnico asignado.",
     *     tags={"Reparaciones"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="search",
     *         in="query",
     *         description="Texto para filtrar por descripción, equipo, cliente o técnico",
     *         required=false,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Parameter(
     *         name="page",
     *         in="query",
     *         description="Número de página",
     *         required=false,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="per_page",
     *         in="query",
     *         description="Cantidad de resultados por página",
     *         required=false,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Lista completa de reparaciones",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="data", type="array",
     *                 @OA\Items(
     *                     type="object",
     *                     @OA\Property(property="id", type="integer"),
     *                     @OA\Property(property="descripcion", type="string"),
     *                     @OA\Property(property="estado", type="string"),
     *                     @OA\Property(property="fecha", type="string", format="date"),
     *                     @OA\Property(property="equipo_nombre", type="string", example="Notebook Lenovo"),
     *                     @OA\Property(property="cliente_nombre", type="string", example="Juan Pérez"),
     *                     @OA\Property(property="tecnico_nombre", type="string", example="Carlos Gómez"),
     *                     @OA\Property(
     *                         property="equipo",
     *                         type="object",
     *                         @OA\Property(property="id", type="integer"),
     *                         @OA\Property(property="descripcion", type="string"),
     *                         @OA\Property(property="marca", type="string"),
     *                         @OA\Property(property="modelo", type="string"),
     *                         @OA\Property(
     *                             property="cliente",
     *                             type="object",
     *                             @OA\Property(property="id", type="integer"),
     *                             @OA\Property(property="nombre", type="string"),
     *                             @OA\Property(property="telefono", type="string"),
     *                             @OA\Property(property="email", type="string")
     *                         )
     *                     ),
     *                     @OA\Property(
     *                         property="tecnico",
     *                         type="object",
     *                         @OA\Property(property="id", type="integer"),
     *                         @OA\Property(property="nombre", type="string"),
     *                         @OA\Property(property="email", type="string")
     *                     )
     *                 )
     *             ),
     *             @OA\Property(property="links", type="object"),
     *             @OA\Property(property="meta", type="object")
     *         )
     *     )
     * )
     */
    public function completo(Request $request)
    {
        try {
            $query = Reparacion::with([
                'equipo.cliente',
                'tecnico',
                'repuestos'
            ]);

            // Búsqueda
            if ($request->has('search') && $request->search !== '') {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('descripcion', 'LIKE', "%$search%")
                    ->orWhere('estado', 'LIKE', "%$search%")
                    ->orWhere('fecha', 'LIKE', "%$search%")
                    ->orWhereHas('equipo', function ($q2) use ($search) {
                        $q2->where('descripcion', 'LIKE', "%$search%")
                            ->orWhere('marca', 'LIKE', "%$search%")
                            ->orWhere('modelo', 'LIKE', "%$search%")
                            ->orWhere('nro_serie', 'LIKE', "%$search%")
                            ->orWhereHas('cliente', function ($q3) use ($search) {
                                $q3->where('nombre', 'LIKE', "%$search%")
                                    ->orWhere('email', 'LIKE', "%$search%")
                                    ->orWhere('telefono', 'LIKE', "%$search%");
                            });
                    })
                    ->orWhereHas('tecnico', function ($q2) use ($search) {
                        $q2->where('nombre', 'LIKE', "%$search%")
                            ->orWhere('email', 'LIKE', "%$search%");
                    });
                });
            }

            // Orden por defecto
            $query->orderBy('id', 'desc');

            // Paginación
            $perPage = $request->get('per_page', 10);
            $reparaciones = $query->paginate($perPage);

            // Transformar datos para incluir campos calculados
            $reparaciones->getCollection()->transform(function ($reparacion) {
                return [
                    'id' => $reparacion->id,
                    'descripcion' => $reparacion->descripcion,
                    'fecha' => $reparacion->fecha,
                    'estado' => $reparacion->estado,
                    'equipo_id' => $reparacion->equipo_id,
                    'usuario_id' => $reparacion->usuario_id,
                    'equipo_nombre' => $reparacion->equipo->descripcion ?? 'Sin equipo',
                    'cliente_nombre' => $reparacion->equipo->cliente->nombre ?? 'No especificado',
                    'tecnico_nombre' => $reparacion->tecnico->nombre ?? 'Sin técnico',
                    'equipo' => $reparacion->equipo,
                    'tecnico' => $reparacion->tecnico,
                    'repuestos' => $reparacion->repuestos
                ];
            });

            return response()->json($reparaciones);

        } catch (\Exception $e) {
            Log::error('Error en completo método: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error al cargar reparaciones: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/reparaciones/{reparacionId}/repuestos",
     *     summary="Asignar un repuesto a una reparación",
     *     tags={"Reparaciones"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="reparacionId",
     *         in="path",
     *         required=true,
     *         description="ID de la reparación",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"repuesto_id", "cantidad"},
     *             @OA\Property(property="repuesto_id", type="integer", example=1),
     *             @OA\Property(property="cantidad", type="integer", example=2)
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Repuesto asignado correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Repuesto asignado correctamente"),
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Repuesto"))
     *         )
     *     ),
     *     @OA\Response(response=400, description="Stock insuficiente o datos inválidos"),
     *     @OA\Response(response=404, description="Reparación o repuesto no encontrado"),
     *     @OA\Response(response=500, description="Error al asignar repuesto")
     * )
     */
    public function assignRepuesto(Request $request, $reparacionId)
    {
        Log::info('AssignRepuesto llamado', ['reparacion_id' => $reparacionId, 'request' => $request->all()]);

        $request->validate([
            'repuesto_id' => 'required|exists:repuesto,id',
            'cantidad' => 'required|integer|min:1'
        ]);

        try {
            DB::beginTransaction();

            $reparacion = Reparacion::findOrFail($reparacionId);
            $repuesto = Repuesto::findOrFail($request->repuesto_id);

            Log::info('Encontrados', [
                'reparacion' => $reparacion->id,
                'repuesto' => $repuesto->id,
                'stock_actual' => $repuesto->stock,
                'cantidad_solicitada' => $request->cantidad
            ]);

            // Verificar stock
            if ($repuesto->stock < $request->cantidad) {
                return response()->json([
                    'error' => 'Stock insuficiente. Solo hay ' . $repuesto->stock . ' unidades disponibles.'
                ], 400);
            }

            // Verificar si ya existe la relación
            $existingRelation = DB::table('reparacion_repuesto')
                ->where('reparacion_id', $reparacionId)
                ->where('repuesto_id', $request->repuesto_id)
                ->first();

            if ($existingRelation) {
                // Actualizar cantidad existente
                DB::table('reparacion_repuesto')
                    ->where('id', $existingRelation->id)
                    ->update([
                        'cantidad' => $existingRelation->cantidad + $request->cantidad,
                        'updated_at' => now()
                    ]);
            } else {
                // Crear nueva relación
                DB::table('reparacion_repuesto')->insert([
                    'reparacion_id' => $reparacionId,
                    'repuesto_id' => $request->repuesto_id,
                    'cantidad' => $request->cantidad,
                    'costo_unitario' => $repuesto->costo_base,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            // Actualizar stock del repuesto
            $repuesto->decrement('stock', $request->cantidad);

            DB::commit();

            // Cargar relación actualizada
            $reparacion->load('repuestos');

            return response()->json([
                'message' => 'Repuesto asignado correctamente',
                'data' => $reparacion->repuestos
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error en assignRepuesto', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Error al asignar repuesto: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/reparaciones/{reparacionId}/repuestos/{pivotId}",
     *     summary="Remover un repuesto de una reparación",
     *     tags={"Reparaciones"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="reparacionId",
     *         in="path",
     *         required=true,
     *         description="ID de la reparación",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="pivotId",
     *         in="path",
     *         required=true,
     *         description="ID del registro pivot en la tabla reparacion_repuesto",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Repuesto removido correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Repuesto removido correctamente")
     *         )
     *     ),
     *     @OA\Response(response=404, description="Repuesto no encontrado en esta reparación"),
     *     @OA\Response(response=500, description="Error al remover repuesto")
     * )
     */
    public function removeRepuesto($reparacionId, $pivotId)
    {
        Log::info('RemoveRepuesto llamado', ['reparacion_id' => $reparacionId, 'pivot_id' => $pivotId]);

        try {
            DB::beginTransaction();

            // Obtener el registro pivot
            $pivot = DB::table('reparacion_repuesto')
                ->where('id', $pivotId)
                ->where('reparacion_id', $reparacionId)
                ->first();

            if (!$pivot) {
                return response()->json(['error' => 'Repuesto no encontrado en esta reparación'], 404);
            }

            Log::info('Pivot encontrado', [
                'repuesto_id' => $pivot->repuesto_id,
                'cantidad' => $pivot->cantidad
            ]);

            // Restaurar stock
            $repuesto = Repuesto::find($pivot->repuesto_id);
            if ($repuesto) {
                $repuesto->increment('stock', $pivot->cantidad);
                Log::info('Stock restaurado', [
                    'repuesto_id' => $repuesto->id,
                    'cantidad_restaurada' => $pivot->cantidad,
                    'nuevo_stock' => $repuesto->stock
                ]);
            }

            // Eliminar la relación
            DB::table('reparacion_repuesto')->where('id', $pivotId)->delete();

            DB::commit();

            return response()->json([
                'message' => 'Repuesto removido correctamente'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error en removeRepuesto', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Error al remover repuesto: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/reparaciones/{reparacionId}/repuestos",
     *     summary="Obtener repuestos asignados a una reparación",
     *     tags={"Reparaciones"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="reparacionId",
     *         in="path",
     *         required=true,
     *         description="ID de la reparación",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Lista de repuestos asignados",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Repuesto"))
     *         )
     *     ),
     *     @OA\Response(response=404, description="Reparación no encontrada"),
     *     @OA\Response(response=500, description="Error al cargar repuestos asignados")
     * )
     */
    public function getRepuestosAsignados($reparacionId)
    {
        Log::info('GetRepuestosAsignados llamado', ['reparacion_id' => $reparacionId]);

        try {
            $reparacion = Reparacion::with(['repuestos' => function($query) {
                $query->withPivot('id', 'cantidad', 'costo_unitario', 'created_at', 'updated_at');
            }])->findOrFail($reparacionId);
            
            Log::info('Repuestos asignados encontrados', [
                'count' => $reparacion->repuestos->count()
            ]);

            return response()->json([
                'data' => $reparacion->repuestos
            ]);

        } catch (\Exception $e) {
            Log::error('Error en getRepuestosAsignados', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Error al cargar repuestos asignados: ' . $e->getMessage()
            ], 500);
        }
    }
}