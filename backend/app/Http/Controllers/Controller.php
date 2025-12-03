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
 * 
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
 * @OA\Schema(
 *     schema="DetalleCobro",
 *     type="object",
 *     title="DetalleCobro",
 *     description="Modelo de Detalle de Cobro",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="cobro_id", type="integer", example=1),
 *     @OA\Property(property="medio_cobro_id", type="integer", example=2),
 *     @OA\Property(property="monto_pagado", type="number", format="float", example=1500.50),
 *     @OA\Property(property="fecha", type="string", format="date-time"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 * 
 * // =============================================
 * // SCHEMAS NUEVOS AGREGADOS PARA COMPLETAR
 * // =============================================
 * 
 * @OA\Schema(
 *     schema="Cobro",
 *     type="object",
 *     title="Cobro",
 *     description="Modelo que representa un cobro/pago registrado para una factura",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="factura_id", type="integer", example=1),
 *     @OA\Property(property="monto", type="number", format="float", example=15000.50),
 *     @OA\Property(property="fecha", type="string", format="date-time", example="2024-01-15T14:30:00.000000Z"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time"),
 *     @OA\Property(
 *         property="factura",
 *         ref="#/components/schemas/Factura",
 *         description="Factura asociada al cobro"
 *     ),
 *     @OA\Property(
 *         property="detalles",
 *         type="array",
 *         @OA\Items(ref="#/components/schemas/DetalleCobro"),
 *         description="Detalles del cobro (medios de pago utilizados)"
 *     )
 * )
 * 
 * @OA\Schema(
 *     schema="Especializacion",
 *     type="object",
 *     title="Especialización",
 *     description="Modelo que representa una especialización técnica",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="nombre", type="string", example="Reparación de Notebooks"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 * 
 * @OA\Schema(
 *     schema="PaginationLink",
 *     type="object",
 *     description="Enlace de paginación",
 *     @OA\Property(property="url", type="string", nullable=true, example="http://localhost:8000/api/cobros?page=2"),
 *     @OA\Property(property="label", type="string", example="Siguiente &raquo;"),
 *     @OA\Property(property="active", type="boolean", example=false)
 * )
 * 
 * @OA\Schema(
 *     schema="ErrorResponse",
 *     type="object",
 *     description="Respuesta de error genérico",
 *     @OA\Property(property="error", type="string", example="Error interno del servidor"),
 *     @OA\Property(property="detalle", type="string", example="Mensaje detallado del error", nullable=true)
 * )
 * 
 * @OA\Schema(
 *     schema="NotFoundResponse",
 *     type="object",
 *     description="Respuesta cuando no se encuentra un recurso",
 *     @OA\Property(property="error", type="string", example="Recurso no encontrado"),
 *     @OA\Property(property="message", type="string", example="El recurso solicitado no existe")
 * )
 * 
 * @OA\Schema(
 *     schema="ValidationErrorResponse",
 *     type="object",
 *     description="Respuesta de error de validación",
 *     @OA\Property(property="error", type="string", example="Datos inválidos"),
 *     @OA\Property(
 *         property="detalles",
 *         type="object",
 *         description="Detalles de los errores de validación",
 *         additionalProperties={
 *             @OA\Property(type="array", @OA\Items(type="string", example="El campo es requerido"))
 *         }
 *     )
 * )
 * 
 * @OA\Schema(
 *     schema="CobroCreatedResponse",
 *     type="object",
 *     description="Respuesta exitosa al crear un cobro",
 *     @OA\Property(property="mensaje", type="string", example="Cobro registrado correctamente."),
 *     @OA\Property(property="cobro", ref="#/components/schemas/Cobro"),
 *     @OA\Property(property="factura_saldo_restante", type="number", format="float", example=5000.00)
 * )
 * 
 * @OA\Schema(
 *     schema="CobroSaldoExcedidoError",
 *     type="object",
 *     description="Error cuando el monto excede el saldo pendiente",
 *     @OA\Property(property="error", type="string", example="El monto pagado excede el saldo pendiente de la factura."),
 *     @OA\Property(property="saldo_pendiente", type="number", format="float", example=10000.00)
 * )
 * 
 * @OA\Schema(
 *     schema="SaldoInfo",
 *     type="object",
 *     description="Información de saldo de una factura",
 *     @OA\Property(property="monto_total", type="number", format="float", example=20000.00),
 *     @OA\Property(property="saldo_pendiente", type="number", format="float", example=5000.00)
 * )
 * 
 * @OA\Schema(
 *     schema="PaginatedResponse",
 *     type="object",
 *     description="Estructura estándar para respuestas paginadas",
 *     @OA\Property(property="current_page", type="integer", example=1),
 *     @OA\Property(property="data", type="array", @OA\Items(type="object")),
 *     @OA\Property(property="first_page_url", type="string"),
 *     @OA\Property(property="from", type="integer"),
 *     @OA\Property(property="last_page", type="integer"),
 *     @OA\Property(property="last_page_url", type="string"),
 *     @OA\Property(property="links", type="array", @OA\Items(ref="#/components/schemas/PaginationLink")),
 *     @OA\Property(property="next_page_url", type="string", nullable=true),
 *     @OA\Property(property="path", type="string"),
 *     @OA\Property(property="per_page", type="integer"),
 *     @OA\Property(property="prev_page_url", type="string", nullable=true),
 *     @OA\Property(property="to", type="integer"),
 *     @OA\Property(property="total", type="integer")
 * )
 * 
 * @OA\Schema(
 *     schema="LoginRequest",
 *     type="object",
 *     required={"email", "password"},
 *     @OA\Property(property="email", type="string", format="email", example="admin@example.com"),
 *     @OA\Property(property="password", type="string", example="password123")
 * )
 * 
 * @OA\Schema(
 *     schema="LoginResponse",
 *     type="object",
 *     @OA\Property(property="access_token", type="string", example="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."),
 *     @OA\Property(property="token_type", type="string", example="bearer"),
 *     @OA\Property(property="expires_in", type="integer", example=3600),
 *     @OA\Property(property="user", ref="#/components/schemas/User")
 * )
 */
abstract class Controller
{
    //
}