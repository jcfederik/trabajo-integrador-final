<?php

namespace App\Http\Controllers;

use App\Models\MedioCobro;
use Illuminate\Http\Request;

        // Schema::create('medio_cobro', function (Blueprint $table) {
        //     $table->id();
        //     $table->string('nombre', 100);

class MedioCobroController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $mediocobro = MedioCobro::all();
            return response()->json($mediocobro);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener medios de cobro', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {

    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $mediocobro = $request->validate([
            'nombre' => 'required|string|max:100',

        ]);

        $mediocobro = MedioCobro::create($mediocobro);
        return response()->json($mediocobro, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $mediocobro = MedioCobro::findOrFail($id);
        return response()->json($mediocobro);
    }

    

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $mediocobro = MedioCobro::findOrFail($id);

        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $mediocobro = MedioCobro::findOrFail($id);
        $mediocobro->delete();
        return response()-json('message', 'Medio de cobro eliminado correctamente');
    }
}
