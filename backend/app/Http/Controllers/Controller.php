<?php

namespace App\Http\Controllers;

/**
 * @OA\Info(
 *     title="API Documentation",
 *     version="1.0",
 *     description="Documentación de la API del sistema de gestión"
 * )
 * 
 * @OA\Server(
 *     url="http://localhost:8000",
 *     description="Servidor Local"
 * )
 * 
 * @OA\SecurityScheme(
 *     securityScheme="bearerAuth",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT"
 * )
 * 
 * @OA\Schema(
 *     schema="User",
 *     type="object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="nombre", type="string", example="admin"),
 *     @OA\Property(property="tipo", type="string", enum={"administrador", "tecnico", "usuario"}, example="administrador")
 * )
 * 
 * @OA\Schema(
 *     schema="Error",
 *     type="object",
 *     @OA\Property(property="error", type="string", example="Mensaje de error")
 * )
 * 
 * @OA\Schema(
 *     schema="ValidationError",
 *     type="object",
 *     @OA\Property(
 *         property="error",
 *         type="object",
 *         @OA\Property(property="campo", type="array", @OA\Items(type="string", example="El campo es requerido"))
 *     )
 * )
 * 
 * @OA\Schema(
 *     schema="SuccessMessage",
 *     type="object",
 *     @OA\Property(property="message", type="string", example="Operación exitosa")
 * )
 * 
 * @OA\Schema(
 *     schema="Presupuesto",
 *     type="object",
 *     title="Presupuesto",
 *     description="Modelo de Presupuesto",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="reparacion_id", type="integer", example=5),
 *     @OA\Property(property="monto_total", type="number", format="float", example=12500.75),
 *     @OA\Property(property="aceptado", type="boolean", example=true),
 *     @OA\Property(property="fecha", type="string", format="date-time", example="2025-10-11T15:00:00Z"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 * 
 * /**
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
 * 
 * /**
 * @OA\Schema(
 *     schema="Reparacion",
 *     type="object",
 *     title="Reparacion",
 *     description="Modelo de Reparación",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="equipo_id", type="integer", example=2),
 *     @OA\Property(property="usuario_id", type="integer", example=5),
 *     @OA\Property(property="descripcion", type="string", example="Cambio de fuente de alimentación"),
 *     @OA\Property(property="fecha", type="string", format="date-time", example="2025-10-11T10:30:00Z"),
 *     @OA\Property(property="estado", type="string", example="en proceso"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 * /**
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
 * 
 * /**
 * @OA\Schema(
 *     schema="Repuesto",
 *     type="object",
 *     title="Repuesto",
 *     description="Modelo de Repuesto",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="nombre", type="string", example="Filtro de aire"),
 *     @OA\Property(property="stock", type="integer", example=50),
 *     @OA\Property(property="costo_base", type="number", format="float", example=1500.75),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 * 
 * /**
 * @OA\Schema(
 *     schema="Factura",
 *     type="object",
 *     title="Factura",
 *     description="Modelo de Factura",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="presupuesto_id", type="integer", example=3),
 *     @OA\Property(property="numero", type="string", example="F0001-00002345"),
 *     @OA\Property(property="letra", type="string", example="A"),
 *     @OA\Property(property="fecha", type="string", format="date-time", example="2025-10-11T14:30:00Z"),
 *     @OA\Property(property="monto_total", type="number", format="float", example=15200.50),
 *     @OA\Property(property="detalle", type="string", example="Reparación general de equipos informáticos"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 * 
 * /**
 * @OA\Schema(
 *     schema="Equipo",
 *     type="object",
 *     title="Equipo",
 *     description="Modelo que representa un equipo técnico ingresado al taller",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="descripcion", type="string", example="Notebook Lenovo con pantalla rota"),
 *     @OA\Property(property="marca", type="string", example="Lenovo"),
 *     @OA\Property(property="modelo", type="string", example="IdeaPad 320"),
 *     @OA\Property(property="nro_serie", type="string", example="SN-1234567890"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 * 
 * /**
 * @OA\Schema(
 *     schema="CompraRepuesto",
 *     type="object",
 *     title="Compra de Repuesto",
 *     description="Modelo de Compra de Repuesto",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="proveedor_id", type="integer", example=3),
 *     @OA\Property(property="repuesto_id", type="integer", example=7),
 *     @OA\Property(property="numero_comprobante", type="string", example="FAC-2025-001"),
 *     @OA\Property(property="total", type="number", format="float", example=25900.50),
 *     @OA\Property(property="estado", type="boolean", example=true),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 * 
 * /**
 * @OA\Schema(
 *     schema="Cliente",
 *     type="object",
 *     title="Cliente",
 *     description="Modelo que representa un cliente registrado en el sistema",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="nombre", type="string", example="Juan Pérez"),
 *     @OA\Property(property="email", type="string", example="juanperez@example.com"),
 *     @OA\Property(property="telefono", type="string", example="+54 9 345 4129626"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 * 
 * 
 */
abstract class Controller
{
    //
}