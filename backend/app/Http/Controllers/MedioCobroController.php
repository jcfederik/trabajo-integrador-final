<?php

namespace App\Http\Controllers;

use App\Models\MedioCobro;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * @OA\Tag(
 *     name="Medios de Cobro",
 *     description="Operaciones relacionadas con los medios de cobro disponibles"
 * )
 */

/**
 * @OA\Schema(
 *     schema="MedioCobro",
 *     type="object",
 *     title="Medio de Cobro",
 *     description="Modelo que representa un método o medio de cobro aceptado por el sistema",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="nombre", type="string", example="Transferencia bancaria"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 */
class MedioCobroController extends Controller

{

    /**
     * @OA\Get(
     *     path="/api/medios-cobro",
     *     summary="Obtener todos los medios de cobro",
     *     tags={"Medios de Cobro"},
     *     @OA\Response(
     *         response=200,
     *         description="Lista de medios de cobro obtenida correctamente",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(ref="#/components/schemas/MedioCobro")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error al obtener medios de cobro"
     *     )
     * )
     */



    public function index()
    {
        try {
            $mediosCobro = MedioCobro::all();
            return response()->json($mediosCobro, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener medios de cobro',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * @OA\Post(
     *     path="/api/medios-cobro",
     *     summary="Registrar un nuevo medio de cobro",
     *     tags={"Medios de Cobro"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"nombre"},
     *             @OA\Property(property="nombre", type="string", example="Tarjeta de crédito")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Medio de cobro creado correctamente"),
     *     @OA\Response(response=400, description="Datos inválidos"),
     *     @OA\Response(response=500, description="Error al crear medio de cobro")
     * )
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Datos inválidos', 'detalles' => $validator->errors()], 400);
        }

        try {
            $medioCobro = MedioCobro::create($validator->validated());
            return response()->json(['mensaje' => 'Medio de cobro creado correctamente', 'medio_cobro' => $medioCobro], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al crear medio de cobro', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/medios-cobro/{id}",
     *     summary="Mostrar un medio de cobro específico",
     *     tags={"Medios de Cobro"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del medio de cobro",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Medio de cobro encontrado"),
     *     @OA\Response(response=404, description="Medio de cobro no encontrado")
     * )
     */
    public function show($id)
    {
        try {
            $medioCobro = MedioCobro::findOrFail($id);
            return response()->json($medioCobro, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Medio de cobro no encontrado', 'detalle' => $e->getMessage()], 404);
        }
    }

    /**
     * @OA\Put(
     *     path="/api/medios-cobro/{id}",
     *     summary="Actualizar un medio de cobro existente",
     *     tags={"Medios de Cobro"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del medio de cobro a actualizar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="nombre", type="string", example="Pago en efectivo")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Medio de cobro actualizado correctamente"),
     *     @OA\Response(response=404, description="Medio de cobro no encontrado"),
     *     @OA\Response(response=400, description="Datos inválidos")
     * )
     */
    public function update(Request $request, $id)
    {
        try {
            $medioCobro = MedioCobro::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'nombre' => 'required|string|max:100',
            ]);

            if ($validator->fails()) {
                return response()->json(['error' => 'Datos inválidos', 'detalles' => $validator->errors()], 400);
            }

            $medioCobro->update($validator->validated());

            return response()->json(['mensaje' => 'Medio de cobro actualizado correctamente', 'medio_cobro' => $medioCobro], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Medio de cobro no encontrado'], 404);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al actualizar medio de cobro', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/medios-cobro/{id}",
     *     summary="Eliminar un medio de cobro",
     *     tags={"Medios de Cobro"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del medio de cobro a eliminar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Medio de cobro eliminado correctamente"),
     *     @OA\Response(response=404, description="Medio de cobro no encontrado"),
     *     @OA\Response(response=500, description="Error al eliminar medio de cobro")
     * )
     */
    public function destroy($id)
    {
        try {
            $medioCobro = MedioCobro::findOrFail($id);
            $medioCobro->delete();

            return response()->json(['mensaje' => 'Medio de cobro eliminado correctamente'], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Medio de cobro no encontrado'], 404);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al eliminar medio de cobro', 'detalle' => $e->getMessage()], 500);
        }
    }
}
