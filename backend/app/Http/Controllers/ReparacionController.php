<?php

namespace App\Http\Controllers;

use App\Models\Reparacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

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
        try {
            $perPage = $request->get('per_page', 15);
            $page = $request->get('page', 1);
            
            $reparaciones = Reparacion::with(['equipo', 'tecnico', 'repuestos'])->paginate($perPage, ['*'], 'page', $page);
            return response()->json($reparaciones, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener las reparaciones', 'detalle' => $e->getMessage()], 500);
        }
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
}