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
      switch (error.status) {
        case 401:
          authService.logout();
          router.navigate(['/login'], { 
            queryParams: { returnUrl: router.url } 
          });
          break;

        case 403:
          break;

        case 404:
          break;

        case 422:
          break;

        case 500:
          break;
      }

      return throwError(() => error);
    })
  );
};