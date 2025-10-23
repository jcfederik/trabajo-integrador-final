<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Repuesto;
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
     *     path="/api/repuesto",
     *     summary="Obtener todos los repuestos",
     *     tags={"Repuestos"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200, 
     *         description="Lista de repuestos obtenida correctamente",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(ref="#/components/schemas/Repuesto")
     *         )
     *     ),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=500, description="Error al obtener los repuestos")
     * )
     */
    public function index()
    {
        try {
            $repuestos = Repuesto::all();
            return response()->json($repuestos, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener los repuestos', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/repuesto",
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
     *     path="/api/repuesto/{id}",
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
     *     path="/api/repuesto/{id}",
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
     * @OA\Delete(
     *     path="/api/repuesto/{id}",
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