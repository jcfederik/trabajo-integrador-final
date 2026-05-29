import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AlertService } from './alert.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const alertService = inject(AlertService);

  let token = localStorage.getItem('token') ?? '';

  if (token.startsWith('"') || token.startsWith("'")) {
    token = token.replace(/^["']|["']$/g, '');
  }

  const authReq =
    token.length > 10
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        })
      : req;

  return next(authReq).pipe(
    catchError((err) => {
      if (req.url.includes('/login')) {
        return throwError(() => err);
      }

      if (err.status === 401) {
        alertService.showError('Sesión expirada', 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.');

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!router.url.startsWith('/login')) {
          router.navigateByUrl('/login');
        }
      }

      return throwError(() => err);
    })
  );
};