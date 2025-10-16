<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Proveedor;
use Illuminate\Support\Facades\Validator;

/**
 * @OA\Tag(
 *     name="Proveedores",
 *     description="Operaciones relacionadas con la gestión de proveedores"
 * )
 *
 * @OA\Schema(
 *     schema="Proveedor",
 *     type="object",
 *     title="Proveedor",
 *     description="Modelo de Proveedor",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="razon_social", type="string", example="Repuestos S.A."),
 *     @OA\Property(property="cuit", type="string", example="20345678901"),
 *     @OA\Property(property="direccion", type="string", example="Av. Corrientes 1234"),
 *     @OA\Property(property="telefono", type="string", example="1123456789"),
 *     @OA\Property(property="email", type="string", example="contacto@repuestos.com"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 */
class ProveedorController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/proveedor",
     *     summary="Obtener todos los proveedores",
     *     tags={"Proveedores"},
     *     @OA\Response(response=200, description="Lista de proveedores obtenida correctamente"),
     *     @OA\Response(response=500, description="Error al obtener los proveedores")
     * )
     */
    public function index()
    {
        try {
            $proveedores = Proveedor::all();
            return response()->json($proveedores, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener los proveedores', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/proveedor",
     *     summary="Crear un nuevo proveedor",
     *     tags={"Proveedores"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"razon_social", "cuit", "direccion", "telefono", "email"},
     *             @OA\Property(property="razon_social", type="string", example="Repuestos S.A."),
     *             @OA\Property(property="cuit", type="string", example="20345678901"),
     *             @OA\Property(property="direccion", type="string", example="Av. Corrientes 1234"),
     *             @OA\Property(property="telefono", type="string", example="1123456789"),
     *             @OA\Property(property="email", type="string", example="contacto@repuestos.com")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Proveedor creado correctamente"),
     *     @OA\Response(response=400, description="Datos inválidos"),
     *     @OA\Response(response=500, description="Error al crear el proveedor")
     * )
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'razon_social' => 'required|string|max:255',
            'cuit' => 'required|numeric|digits_between:8,11',
            'direccion' => 'required|string|max:255',
            'telefono' => 'required|string|max:20',
            'email' => 'required|email|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Datos inválidos', 'detalles' => $validator->errors()], 400);
        }

        try {
            $proveedor = Proveedor::create($validator->validated());
            return response()->json(['mensaje' => 'Proveedor creado correctamente', 'proveedor' => $proveedor], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al crear el proveedor', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/proveedor/{id}",
     *     summary="Obtener un proveedor específico",
     *     tags={"Proveedores"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del proveedor",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Proveedor encontrado"),
     *     @OA\Response(response=404, description="Proveedor no encontrado")
     * )
     */
    public function show(string $id)
    {
        $proveedor = Proveedor::find($id);
        if (!$proveedor) {
            return response()->json(['error' => 'Proveedor no encontrado'], 404);
        }
        return response()->json($proveedor, 200);
    }

    /**
     * @OA\Put(
     *     path="/api/proveedor/{id}",
     *     summary="Actualizar un proveedor existente",
     *     tags={"Proveedores"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del proveedor a actualizar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="razon_social", type="string", example="Repuestos Actualizados S.A."),
     *             @OA\Property(property="cuit", type="string", example="20999888777"),
     *             @OA\Property(property="direccion", type="string", example="Calle Nueva 456"),
     *             @OA\Property(property="telefono", type="string", example="1133344455"),
     *             @OA\Property(property="email", type="string", example="actualizado@empresa.com")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Proveedor actualizado correctamente"),
     *     @OA\Response(response=404, description="Proveedor no encontrado"),
     *     @OA\Response(response=500, description="Error al actualizar el proveedor")
     * )
     */
    public function update(Request $request, string $id)
    {
        $proveedor = Proveedor::find($id);
        if (!$proveedor) {
            return response()->json(['error' => 'Proveedor no encontrado'], 404);
        }

        try {
            $proveedor->update($request->all());
            return response()->json(['mensaje' => 'Proveedor actualizado correctamente', 'proveedor' => $proveedor], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al actualizar el proveedor', 'detalle' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/proveedor/{id}",
     *     summary="Eliminar un proveedor",
     *     tags={"Proveedores"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del proveedor a eliminar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Proveedor eliminado correctamente"),
     *     @OA\Response(response=404, description="Proveedor no encontrado"),
     *     @OA\Response(response=500, description="Error al eliminar el proveedor")
     * )
     */
    public function destroy(string $id)
    {
        $proveedor = Proveedor::find($id);
        if (!$proveedor) {
            return response()->json(['error' => 'Proveedor no encontrado'], 404);
        }

        try {
            $proveedor->delete();
            return response()->json(['mensaje' => 'Proveedor eliminado correctamente'], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al eliminar el proveedor', 'detalle' => $e->getMessage()], 500);
        }
    }
}
