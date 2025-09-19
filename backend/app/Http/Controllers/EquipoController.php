<?php

namespace App\Http\Controllers;

use App\Models\Equipo;
use Illuminate\Http\Request;

class EquipoController extends Controller
{
    // Mostrar todos los equipos
    public function index()
    {
        return response()->json(Equipo::all());
    }

    // Mostrar formulario de creación (si usás vistas)
    public function create()
    {
        // No se usa en API normalmente
    }

    // Guardar un nuevo equipo
    public function store(Request $request)
    {
        $validated = $request->validate([
            'descripcion' => 'required|string|max:200',
            'marca' => 'nullable|string|max:100',
            'modelo' => 'nullable|string|max:100',
            'nro_serie' => 'nullable|string|max:100',
        ]);

        $equipo = Equipo::create($validated);

        return response()->json($equipo, 201);
    }

    // Mostrar un equipo específico
    public function show($id)
    {
        $equipo = Equipo::findOrFail($id);
        return response()->json($equipo);
    }

    // Mostrar formulario de edición (si usás vistas)
    public function edit($id)
    {
        // No se usa en API normalmente
    }

    // Actualizar un equipo
    public function update(Request $request, $id)
    {
        $equipo = Equipo::findOrFail($id);

        $validated = $request->validate([
            'descripcion' => 'required|string|max:200',
            'marca' => 'nullable|string|max:100',
            'modelo' => 'nullable|string|max:100',
            'nro_serie' => 'nullable|string|max:100',
        ]);

        $equipo->update($validated);

        return response()->json($equipo);
    }

    // Eliminar un equipo
    public function destroy($id)
    {
        $equipo = Equipo::findOrFail($id);
        $equipo->delete();

        return response()->json(['message' => 'Equipo eliminado correctamente']);
    }
}