import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

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
        console.warn('Token inválido o expirado. Limpiando sesión.');

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
