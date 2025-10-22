import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      console.error('HTTP Error:', error);

      // Manejar diferentes tipos de errores
      if (error.status === 401) {
        // Token expirado o inválido
        localStorage.removeItem('token');
        router.navigate(['/login']);
      } else if (error.status === 403) {
        // Sin permisos
        console.error('Acceso denegado');
      } else if (error.status >= 500) {
        // Error del servidor
        console.error('Error interno del servidor');
      }

      return throwError(() => error);
    })
  );
};