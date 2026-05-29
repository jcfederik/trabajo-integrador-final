<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Cliente;
use App\Models\Factura;
use Illuminate\Database\QueryException;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Validator;

/**
 * @OA\Tag(
 *     name="Clientes",
 *     description="Operaciones relacionadas con los clientes del sistema"
 * )
 */
class ClienteController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/clientes",
     *     summary="Listar todos los clientes con paginación",
     *     tags={"Clientes"},
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
     *         @OA\Schema(type="string", example="ana")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Lista de clientes obtenida correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Cliente")),
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
     *         description="Error al obtener clientes"
     *     )
     * )
     */
    public function index(Request $request)
    {
        try {


            $perPage = (int) $request->get('per_page', 15);
            $page = (int) $request->get('page', 1);
            $search = $request->get('search', '');
            
            $query = Cliente::query();

            if (!empty($search)) {
                
                $query->where(function($q) use ($search) {
                    $q->where('nombre', 'LIKE', "%{$search}%")
                      ->orWhere('email', 'LIKE', "%{$search}%")
                      ->orWhere('telefono', 'LIKE', "%{$search}%");
                });
            }

            $clientes = $query->orderBy('created_at', 'desc')
                            ->paginate($perPage, ['*'], 'page', $page);

            return response()->json($clientes, 200);
            
        } catch (\Throwable $e) {

            return response()->json([
                'error' => 'Error al obtener los clientes',
                'detalle' => env('APP_DEBUG') ? $e->getMessage() : 'Error interno del servidor'
            ], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/clientes",
     *     summary="Registrar un nuevo cliente",
     *     tags={"Clientes"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"nombre","email"},
     *             @OA\Property(property="nombre", type="string", example="Ana Gómez"),
     *             @OA\Property(property="email", type="string", example="ana@example.com"),
     *             @OA\Property(property="telefono", type="string", example="+54 9 345 1234567")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Cliente creado correctamente",
     *         @OA\JsonContent(ref="#/components/schemas/Cliente")
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="No autorizado"
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validación fallida"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error al crear cliente"
     *     )
     * )
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'nombre' => 'required|string|max:120',
                'email' => 'required|email|unique:cliente,email',
                'telefono' => 'nullable|string|max:30',
            ]);

            $cliente = Cliente::create($request->all());
            return response()->json($cliente, 201);

        } catch (ValidationException $e) {
            return response()->json(['error' => 'Validación fallida', 'messages' => $e->errors()], 422);
        } catch (QueryException $e) {
            return response()->json(['error' => 'Error en la base de datos', 'message' => $e->getMessage()], 500);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error inesperado', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/clientes/{id}",
     *     summary="Obtener un cliente específico",
     *     tags={"Clientes"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del cliente a mostrar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Cliente encontrado",
     *         @OA\JsonContent(ref="#/components/schemas/Cliente")
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="No autorizado"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Cliente no encontrado"
     *     )
     * )
     */
    public function show($id)
    {
        try {
            $cliente = Cliente::findOrFail($id);
            return response()->json($cliente);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Cliente no encontrado'], 404);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error inesperado', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Put(
     *     path="/api/clientes/{id}",
     *     summary="Actualizar los datos de un cliente existente",
     *     tags={"Clientes"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del cliente a actualizar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="nombre", type="string", example="Juan Carlos López"),
     *             @OA\Property(property="email", type="string", example="juanclopez@example.com"),
     *             @OA\Property(property="telefono", type="string", example="345-4129 626")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Cliente actualizado correctamente",
     *         @OA\JsonContent(ref="#/components/schemas/Cliente")
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="No autorizado"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Cliente no encontrado"
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validación fallida"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error al actualizar cliente"
     *     )
     * )
     */
    public function update(Request $request, $id)
    {
        try {
            $cliente = Cliente::findOrFail($id);

            $request->validate([
                'nombre' => 'sometimes|required|string|max:120',
                'email' => 'sometimes|required|email|unique:cliente,email,' . $id,
                'telefono' => 'nullable|string|max:30',
            ]);

            $cliente->update($request->all());
            return response()->json($cliente);

        } catch (ValidationException $e) {
            return response()->json(['error' => 'Validación fallida', 'messages' => $e->errors()], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Cliente no encontrado'], 404);
        } catch (QueryException $e) {
            return response()->json(['error' => 'Error en la base de datos', 'message' => $e->getMessage()], 500);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error inesperado', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/clientes/{id}",
     *     summary="Eliminar un cliente del sistema",
     *     tags={"Clientes"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del cliente a eliminar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Cliente eliminado correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Cliente eliminado")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="No autorizado"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Cliente no encontrado"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error al eliminar cliente"
     *     )
     * )
     */
    public function destroy($id)
    {
        try {
            $cliente = Cliente::findOrFail($id);
            $cliente->delete();
            return response()->json(['message' => 'Cliente eliminado'], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Cliente no encontrado'], 404);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error inesperado', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/clientes/buscar",
     *     summary="Buscar clientes por término",
     *     tags={"Clientes"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="q",
     *         in="query",
     *         required=true,
     *         description="Término de búsqueda (mínimo 2 caracteres)",
     *         @OA\Schema(type="string", example="Ana")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Resultados de búsqueda",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(ref="#/components/schemas/Cliente")
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
                
        try {
            $clientes = Cliente::where('nombre', 'LIKE', "%{$termino}%")
                ->orWhere('email', 'LIKE', "%{$termino}%")
                ->orWhere('telefono', 'LIKE', "%{$termino}%")
                ->limit(10)
                ->get();

            
            return response()->json($clientes);
            
        } catch (\Exception $e) {
            
            return response()->json([
                'error' => 'Error interno del servidor',
                'detalle' => env('APP_DEBUG') ? $e->getMessage() : 'Error interno del servidor'
            ], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/clientes/{id}/facturas",
     *     summary="Obtener todas las facturas de un cliente específico",
     *     tags={"Clientes"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del cliente",
     *         @OA\Schema(type="integer")
     *     ),
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
     *         description="Facturas del cliente obtenidas correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Factura")),
     *             @OA\Property(property="current_page", type="integer", example=1),
     *             @OA\Property(property="last_page", type="integer", example=5),
     *             @OA\Property(property="per_page", type="integer", example=15),
     *             @OA\Property(property="total", type="integer", example=75)
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Cliente no encontrado"
     *     )
     * )
     */
    public function facturasPorCliente(Request $request, $id)
    {
        try {
            $cliente = Cliente::findOrFail($id);
            
            $perPage = $request->get('per_page', 15);
            $page = $request->get('page', 1);

            $facturas = Factura::whereHas('presupuesto.reparacion.equipo', function($query) use ($id) {
                $query->where('cliente_id', $id);
            })
            ->with([
                'presupuesto.reparacion.equipo.cliente',
                'presupuesto.reparacion'
            ])
            ->orderBy('fecha', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

            return response()->json($facturas);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Cliente no encontrado'], 404);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener facturas del cliente', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/clientes/{id}/facturas/todas",
     *     summary="Obtener TODAS las facturas de un cliente (sin paginación)",
     *     tags={"Clientes"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del cliente",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Todas las facturas del cliente",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(ref="#/components/schemas/Factura")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Cliente no encontrado"
     *     )
     * )
     */
    public function todasFacturasPorCliente($id)
    {
        try {
            $cliente = Cliente::findOrFail($id);

            $facturas = Factura::whereHas('presupuesto.reparacion.equipo', function($query) use ($id) {
                $query->where('cliente_id', $id);
            })
            ->with([
                'presupuesto.reparacion.equipo.cliente',
                'presupuesto.reparacion'
            ])
            ->orderBy('fecha', 'desc')
            ->get();

            return response()->json($facturas);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Cliente no encontrado'], 404);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener facturas del cliente', 'message' => $e->getMessage()], 500);
        }
    }
}