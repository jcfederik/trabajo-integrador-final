<?php

namespace App\Http\Controllers;

use App\Models\Equipo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * @OA\Tag(
 *     name="Equipos",
 *     description="Operaciones relacionadas con los equipos registrados en el sistema"
 * )
 */
class EquipoController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/equipos",
     *     summary="Obtener todos los equipos registrados con paginación",
     *     tags={"Equipos"},
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
     *         description="Lista de equipos obtenida correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Equipo")),
     *             @OA\Property(property="current_page", type="integer", example=1),
     *             @OA\Property(property="last_page", type="integer", example=5),
     *             @OA\Property(property="per_page", type="integer", example=15),
     *             @OA\Property(property="total", type="integer", example=75)
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="No autorizado"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error al obtener los equipos"
     *     )
     * )
     */
public function index(Request $request)
    {
        try {
            $perPage = (int) $request->get('per_page', 15);
            $page = (int) $request->get('page', 1);
            $search = $request->get('search', '');

            $query = Equipo::query();

            if (!empty($search)) {
                $query->where(function($q) use ($search) {
                    $q->where('descripcion', 'LIKE', "%{$search}%")
                      ->orWhere('marca', 'LIKE', "%{$search}%")
                      ->orWhere('modelo', 'LIKE', "%{$search}%")
                      ->orWhere('nro_serie', 'LIKE', "%{$search}%")
                      ->orWhereHas('cliente', function($q2) use ($search) {
                          $q2->where('nombre', 'LIKE', "%{$search}%");
                      });
                });
            }

            $equipos = $query->with('cliente')
                           ->orderBy('created_at', 'desc')
                           ->paginate($perPage, ['*'], 'page', $page);

            return response()->json($equipos, 200);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Error al obtener los equipos'], 500);
        }
    }


    /**
     * @OA\Post(
     *     path="/api/equipos",
     *     summary="Registrar un nuevo equipo",
     *     tags={"Equipos"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"descripcion", "cliente_id"},
     *             @OA\Property(property="descripcion", type="string", example="Notebook con problema de encendido"),
     *             @OA\Property(property="cliente_id", type="integer", example=1),
     *             @OA\Property(property="marca", type="string", example="HP"),
     *             @OA\Property(property="modelo", type="string", example="Pavilion 14"),
     *             @OA\Property(property="nro_serie", type="string", example="HP123XYZ")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Equipo creado correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="mensaje", type="string", example="Equipo creado correctamente"),
     *             @OA\Property(property="equipo", ref="#/components/schemas/Equipo")
     *         )
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Datos inválidos"
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="No autorizado"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error al crear equipo"
     *     )
     * )
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'descripcion' => 'required|string|max:200',
            'cliente_id' => 'required|exists:cliente,id',
            'marca' => 'nullable|string|max:100',
            'modelo' => 'nullable|string|max:100',
            'nro_serie' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Datos inválidos', 'detalles' => $validator->errors()], 400);
        }

        try {
            $equipo = Equipo::create($validator->validated());
            return response()->json(['mensaje' => 'Equipo creado correctamente', 'equipo' => $equipo], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al crear equipo', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/equipos/{id}",
     *     summary="Mostrar un equipo específico",
     *     tags={"Equipos"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del equipo a mostrar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Equipo encontrado correctamente",
     *         @OA\JsonContent(ref="#/components/schemas/Equipo")
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="No autorizado"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Equipo no encontrado"
     *     )
     * )
     */
    public function show($id)
    {
        try {
            $equipo = Equipo::findOrFail($id);
            return response()->json($equipo, 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Equipo no encontrado'], 404);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error inesperado', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Put(
     *     path="/api/equipos/{id}",
     *     summary="Actualizar un equipo existente",
     *     tags={"Equipos"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del equipo a actualizar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="descripcion", type="string", example="Notebook con batería reemplazada"),
     *             @OA\Property(property="cliente_id", type="integer", example=1),
     *             @OA\Property(property="marca", type="string", example="Dell"),
     *             @OA\Property(property="modelo", type="string", example="Inspiron 15"),
     *             @OA\Property(property="nro_serie", type="string", example="DL1234ABC")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Equipo actualizado correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="mensaje", type="string", example="Equipo actualizado correctamente"),
     *             @OA\Property(property="equipo", ref="#/components/schemas/Equipo")
     *         )
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Datos inválidos"
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="No autorizado"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Equipo no encontrado"
     *     )
     * )
     */
    public function update(Request $request, $id)
    {
        try {
            $equipo = Equipo::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'descripcion' => 'required|string|max:200',
                'cliente_id' => 'required|exists:cliente,id',
                'marca' => 'nullable|string|max:100',
                'modelo' => 'nullable|string|max:100',
                'nro_serie' => 'nullable|string|max:100',
            ]);

            if ($validator->fails()) {
                return response()->json(['error' => 'Datos inválidos', 'detalles' => $validator->errors()], 400);
            }

            $equipo->update($validator->validated());
            return response()->json(['mensaje' => 'Equipo actualizado correctamente', 'equipo' => $equipo], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Equipo no encontrado'], 404);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al actualizar equipo', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/equipos/{id}",
     *     summary="Eliminar un equipo del sistema",
     *     tags={"Equipos"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del equipo a eliminar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Equipo eliminado correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="mensaje", type="string", example="Equipo eliminado correctamente")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="No autorizado"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Equipo no encontrado"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error al eliminar equipo"
     *     )
     * )
     */
    public function destroy($id)
    {
        try {
            $equipo = Equipo::findOrFail($id);
            $equipo->delete();

            return response()->json(['mensaje' => 'Equipo eliminado correctamente'], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Equipo no encontrado'], 404);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al eliminar equipo', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/equipos/buscar",
     *     summary="Buscar equipos por término",
     *     tags={"Equipos"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="q",
     *         in="query",
     *         required=true,
     *         description="Término de búsqueda (mínimo 2 caracteres)",
     *         @OA\Schema(type="string", example="HP")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Resultados de búsqueda",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(ref="#/components/schemas/Equipo")
     *         )
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Término de búsqueda inválido"
     *     )
     * )
     */
    public function buscar(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'q' => 'required|string|min:2'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Término de búsqueda inválido'], 400);
        }

        $termino = $request->q;
        
        $equipos = Equipo::where('descripcion', 'LIKE', "%{$termino}%")
            ->orWhere('marca', 'LIKE', "%{$termino}%")
            ->orWhere('modelo', 'LIKE', "%{$termino}%")
            ->orWhere('nro_serie', 'LIKE', "%{$termino}%")
            ->limit(10)
            ->get();

        return response()->json($equipos);
    }

    /**
     * @OA\Get(
     *     path="/api/equipos/cliente/{clienteId}",
     *     summary="Obtener equipos por cliente",
     *     tags={"Equipos"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="clienteId",
     *         in="path",
     *         required=true,
     *         description="ID del cliente",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Lista de equipos del cliente",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(ref="#/components/schemas/Equipo")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error al obtener equipos del cliente"
     *     )
     * )
     */
    public function porCliente($clienteId)
    {
        try {
            $equipos = Equipo::where('cliente_id', $clienteId)->get();
            return response()->json($equipos);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener equipos del cliente'], 500);
        }
    }
}