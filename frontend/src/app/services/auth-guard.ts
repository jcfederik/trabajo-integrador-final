import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth';

// ====== AUTENTICACIÓN BÁSICA ======
export const authMatchGuard: CanMatchFn = (_route, _segments): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

// ====== BLOQUEO DE LOGIN ======
export const loginBlockGuard: CanMatchFn = (): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};

// ====== GUARD DE PERMISOS ======
export const permissionGuard: CanMatchFn = (route, segments): boolean | UrlTree => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
        return router.createUrlTree(['/login']);
    }

    if (auth.isAdmin()) {
        return true;
    }

    const requiredPermission = route.data?.['permission'];
    
    if (!requiredPermission) {
        return true;
    }

    if (!auth.hasPermission(requiredPermission)) {
        return router.createUrlTree(['/dashboard']);
    }

    return true;
};