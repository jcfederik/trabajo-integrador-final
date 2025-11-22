import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth';

export const authMatchGuard: CanMatchFn = (_route, _segments): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

// ✅ NUEVO: Guard para permisos específicos
export const permissionGuard: CanMatchFn = (route, segments): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Primero verificar autenticación
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  // Verificar permisos específicos si la ruta los requiere
  const requiredPermission = route.data?.['permission'];
  
  if (requiredPermission && !auth.hasPermission(requiredPermission)) {
    console.warn(`🔒 Acceso denegado: Se requiere permiso "${requiredPermission}"`);
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};