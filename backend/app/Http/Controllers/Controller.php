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
 *     url="http://localhost:8000/api",
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
 */
abstract class Controller
{
    //
}