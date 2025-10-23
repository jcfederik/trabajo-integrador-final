import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const rawToken = localStorage.getItem('token');

  if (rawToken) {
    // Limpiar comillas o prefijos "Bearer "
    const token = rawToken
      .replace(/^["']|["']$/g, '')
      .replace(/^Bearer\s+/i, '')
      .trim();

    console.debug('[AuthInterceptor] Token usado:', token);

    // Clonar la request con el header Authorization
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json', // 👈 Laravel requiere esto para respuestas JSON limpias
      },
    });

    return next(authReq);
  }

  // Si no hay token, continúa sin modificar la request
  return next(req);
};
