<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Cliente;
use Illuminate\Database\QueryException;
use Illuminate\Validation\ValidationException;

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
     *     @OA\Response(
     *         response=200,
     *         description="Lista de clientes obtenida correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Cliente")),
     *             @OA\Property(property="current_page", type="integer", example=1),
     *             @OA\Property(property="last_page", type="integer", example=5),
     *             @OA\Property(property="per_page", type="integer", example=15),
     *             @OA\Property(property="total", type="integer", example=75),
     *             @OA\Property(property="from", type="integer", example=1),
     *             @OA\Property(property="to", type="integer", example=15)
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
            // 🔥 Configurar paginación
            $perPage = $request->get('per_page', 15); // Por defecto 15 elementos por página
            $page = $request->get('page', 1); // Por defecto página 1
            
            $clientes = Cliente::paginate($perPage, ['*'], 'page', $page);
            
            return response()->json($clientes);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener clientes', 'message' => $e->getMessage()], 500);
        }
    }

    // 🔥 Los demás métodos (store, show, update, destroy) se mantienen igual
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
     *         description="Cliente eliminado correctamente"
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
}