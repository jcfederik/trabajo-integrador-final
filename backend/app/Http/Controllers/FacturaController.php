<?php

// app/Http/Controllers/FacturaController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use App\Models\Factura;

class FacturaController extends Controller
{
    public function index(Request $request)
    {
        try {
            $perPage = (int) $request->get('per_page', 15);
            $page    = (int) $request->get('page', 1);
            $search  = $request->get('search', '');

            $q = Factura::query()->orderByDesc('fecha');

            if (!empty($search)) {
                $q->where(function($query) use ($search) {
                    $query->where('numero', 'LIKE', "%{$search}%")
                          ->orWhere('letra', 'LIKE', "%{$search}%")
                          ->orWhere('detalle', 'LIKE', "%{$search}%")
                          ->orWhere('monto_total', 'LIKE', "%{$search}%")
                          ->orWhere('presupuesto_id', 'LIKE', "%{$search}%");
                });
            }

            $facturas = $q->paginate($perPage, ['*'], 'page', $page);
            return response()->json($facturas, 200);
        } catch (\Throwable $e) {
            \Log::error('Error listando facturas', ['err' => $e->getMessage()]);
            return response()->json(['error' => 'Error al obtener las facturas', 'detalle' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $table = (new Factura)->getTable();

        $validator = Validator::make($request->all(), [
            'presupuesto_id' => 'required|exists:presupuesto,id',
            'numero'         => ['required','string','max:50', Rule::unique($table, 'numero')],
            'letra'          => 'required|string|in:A,B,C',
            'fecha'          => 'required|date',
            'monto_total'    => 'required|numeric|min:0',
            'detalle'        => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Datos inválidos', 'detalles' => $validator->errors()], 400);
        }

        try {
            $data = $validator->validated();
            $data['fecha'] = Carbon::parse($data['fecha'])->format('Y-m-d H:i:s');

            $factura = Factura::create($data);
            return response()->json(['mensaje' => 'Factura creada correctamente', 'factura' => $factura], 201);
        } catch (\Throwable $e) {
            \Log::error('Error creando factura', ['err' => $e->getMessage()]);
            return response()->json(['error' => 'Error al crear la factura', 'detalle' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $factura = Factura::find($id);
        if (!$factura) return response()->json(['error' => 'Factura no encontrada'], 404);
        return response()->json($factura, 200);
    }

    public function update(Request $request, $id)
    {
        $factura = Factura::find($id);
        if (!$factura) return response()->json(['error' => 'Factura no encontrada'], 404);

        $table = (new Factura)->getTable();

        $validator = Validator::make($request->all(), [
            'presupuesto_id' => 'sometimes|required|exists:presupuesto,id',
            'numero'         => ['sometimes','required','string','max:50', Rule::unique($table, 'numero')->ignore($id)],
            'letra'          => 'sometimes|required|string|in:A,B,C',
            'fecha'          => 'sometimes|required|date',
            'monto_total'    => 'sometimes|required|numeric|min:0',
            'detalle'        => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Datos inválidos', 'detalles' => $validator->errors()], 400);
        }

        try {
            $data = $validator->validated();
            if (array_key_exists('fecha', $data) && $data['fecha']) {
                $data['fecha'] = Carbon::parse($data['fecha'])->format('Y-m-d H:i:s');
            }
            $factura->update($data);
            return response()->json(['mensaje' => 'Factura actualizada correctamente', 'factura' => $factura], 200);
        } catch (\Throwable $e) {
            \Log::error('Error actualizando factura', ['err' => $e->getMessage()]);
            return response()->json(['error' => 'Error al actualizar la factura', 'detalle' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $factura = Factura::find($id);
        if (!$factura) return response()->json(['error' => 'Factura no encontrada'], 404);

        try {
            $factura->delete();
            return response()->json(['mensaje' => 'Factura eliminada correctamente'], 200);
        } catch (\Throwable $e) {
            \Log::error('Error eliminando factura', ['err' => $e->getMessage()]);
            return response()->json(['error' => 'Error al eliminar la factura', 'detalle' => $e->getMessage()], 500);
        }
    }
}
