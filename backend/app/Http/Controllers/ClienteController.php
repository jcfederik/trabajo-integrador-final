<?php
namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Cliente;
use Illuminate\Database\QueryException;
use Illuminate\Validation\ValidationException;

class ClienteController extends Controller
{
    public function index()
    {
        try {
            $clientes = Cliente::all();
            return response()->json($clientes);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener clientes', 'message' => $e->getMessage()], 500);
        }
    }

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
