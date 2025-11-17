import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error) => {
      console.error('🚨 HTTP Error Interceptor:', {
        url: error.url,
        status: error.status,
        message: error.message
      });

      switch (error.status) {
        case 401: // Unauthorized
          console.warn('🔐 Token inválido o expirado');
          authService.logout();
          router.navigate(['/login'], { 
            queryParams: { returnUrl: router.url } 
          });
          break;

        case 403: // Forbidden
          console.error('⛔ Acceso denegado - Sin permisos suficientes');
          // Podrías redirigir a una página de "acceso denegado"
          break;

        case 404: // Not Found
          console.error('🔍 Recurso no encontrado');
          break;

        case 422: // Unprocessable Entity (validación)
          console.error('📝 Error de validación:', error.error);
          break;

        case 500: // Server Error
          console.error('💥 Error interno del servidor');
          // Podrías mostrar un mensaje al usuario
          break;

        default:
          console.error('❌ Error HTTP no manejado:', error.status);
      }

      // Propagar el error para que los componentes lo manejen
      return throwError(() => error);
    })
  );
};