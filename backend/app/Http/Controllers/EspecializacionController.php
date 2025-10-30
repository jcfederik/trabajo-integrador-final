<?php

namespace App\Http\Controllers;

use App\Models\Especializacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * @OA\Tag(
 *     name="Especializaciones",
 *     description="Gestión de especializaciones técnicas de los usuarios"
 * )
 *
 * @OA\Schema(
 *     schema="Especializacion",
 *     type="object",
 *     title="Especialización",
 *     description="Representa una especialización técnica asignable a un usuario",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="nombre", type="string", example="Electricidad"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 */
class EspecializacionController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/especializaciones",
     *     summary="Obtener todas las especializaciones con paginación",
     *     tags={"Especializaciones"},
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
     *         description="Lista de especializaciones obtenida correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Especializacion")),
     *             @OA\Property(property="current_page", type="integer", example=1),
     *             @OA\Property(property="last_page", type="integer", example=5),
     *             @OA\Property(property="per_page", type="integer", example=15),
     *             @OA\Property(property="total", type="integer", example=75),
     *             @OA\Property(property="from", type="integer", example=1),
     *             @OA\Property(property="to", type="integer", example=15)
     *         )
     *     ),
     *     @OA\Response(response=500, description="Error al obtener especializaciones")
     * )
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 15);
            $page = $request->get('page', 1);
            
            $especializaciones = Especializacion::paginate($perPage, ['*'], 'page', $page);
            return response()->json($especializaciones, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener las especializaciones',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/especializaciones",
     *     summary="Crear una nueva especialización",
     *     tags={"Especializaciones"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"nombre"},
     *             @OA\Property(property="nombre", type="string", example="Mecánica Automotriz")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Especialización creada exitosamente"),
     *     @OA\Response(response=422, description="Error de validación"),
     *     @OA\Response(response=500, description="Error interno del servidor")
     * )
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:100|unique:especializacion,nombre'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Error de validación: revisá los campos ingresados.',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $especializacion = Especializacion::create($validator->validated());
            return response()->json([
                'message' => 'Especialización creada exitosamente',
                'data' => $especializacion
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al crear la especialización',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/especializaciones/{id}",
     *     summary="Obtener una especialización específica",
     *     tags={"Especializaciones"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id", in="path", required=true, description="ID de la especialización",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Especialización encontrada"),
     *     @OA\Response(response=404, description="Especialización no encontrada")
     * )
     */
    public function show($id)
    {
        try {
            $especializacion = Especializacion::findOrFail($id);
            return response()->json($especializacion, 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Especialización no encontrada'], 404);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener la especialización', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Put(
     *     path="/api/especializaciones/{id}",
     *     summary="Actualizar una especialización existente",
     *     tags={"Especializaciones"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id", in="path", required=true, description="ID de la especialización a actualizar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="nombre", type="string", example="Electrónica Industrial")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Especialización actualizada exitosamente"),
     *     @OA\Response(response=404, description="Especialización no encontrada"),
     *     @OA\Response(response=422, description="Error de validación")
     * )
     */
    public function update(Request $request, $id)
    {
        try {
            $especializacion = Especializacion::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'nombre' => 'required|string|max:100|unique:especializacion,nombre,' . $id
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Error de validación: revisá los campos ingresados.',
                    'errors' => $validator->errors()
                ], 422);
            }

            $especializacion->update($validator->validated());

            return response()->json([
                'message' => 'Especialización actualizada exitosamente',
                'data' => $especializacion
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Especialización no encontrada'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al actualizar la especialización',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/especializaciones/{id}",
     *     summary="Eliminar una especialización",
     *     tags={"Especializaciones"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id", in="path", required=true, description="ID de la especialización a eliminar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Especialización eliminada exitosamente"),
     *     @OA\Response(response=404, description="Especialización no encontrada"),
     *     @OA\Response(response=500, description="Error interno del servidor")
     * )
     */
    public function destroy($id)
    {
        try {
            $especializacion = Especializacion::findOrFail($id);
            $especializacion->delete();

            return response()->json([
                'message' => 'Especialización eliminada exitosamente'
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Especialización no encontrada'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al eliminar la especialización',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }
}