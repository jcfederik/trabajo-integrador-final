import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth';
import { AlertService } from './alert.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const alertService = inject(AlertService);

  return next(req).pipe(
    catchError((error) => {
      const shouldSkipLog = 
        (error.url?.includes('/buscar?q=') && error.status === 404) ||
        (error.url?.includes('/buscar?q=') && error.status === 400);

      if (!shouldSkipLog) {
        alertService.showError('Error HTTP', `URL: ${error.url}, Estado: ${error.status}`);
      }

      switch (error.status) {
        case 401:
          authService.logout();
          router.navigate(['/login'], { 
            queryParams: { returnUrl: router.url } 
          });
          break;

        case 403:
          alertService.showError('Acceso denegado', 'No tiene permisos suficientes');
          break;

        case 404:
          if (!shouldSkipLog) {
            alertService.showError('Recurso no encontrado', 'El recurso solicitado no existe');
          }
          break;

        case 422:
          alertService.showError('Error de validación', JSON.stringify(error.error));
          break;

        case 500:
          alertService.showError('Error del servidor', 'Ocurrió un error interno en el servidor');
          break;

        default:
          if (!shouldSkipLog) {
            alertService.showError('Error HTTP', `Código: ${error.status}`);
          }
      }

      return throwError(() => error);
    })
  );
};