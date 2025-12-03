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

    // 1. Verificar Autenticación
    if (!auth.isAuthenticated()) {
        return router.createUrlTree(['/login']);
    }

    // 2. EXCEPCIÓN CLAVE: Si es Administrador, tiene acceso total
    if (auth.isAdmin()) {
        console.log('🔓 Acceso concedido: Usuario es Administrador.');
        return true;
    }

    // 3. Verificar permisos específicos si la ruta los requiere
    const requiredPermission = route.data?.['permission'];
    
    // Si la ruta no pide un permiso específico, se permite el acceso por defecto
    if (!requiredPermission) {
        return true;
    }

    // Verificar si el usuario tiene el permiso requerido
    if (!auth.hasPermission(requiredPermission)) {
        console.warn(`🔒 Acceso denegado: Se requiere permiso "${requiredPermission}"`);
        return router.createUrlTree(['/dashboard']);
    }

    // Si tiene el permiso requerido, se concede el acceso
    console.log(`🔓 Acceso concedido: Permiso "${requiredPermission}" verificado.`);
    return true;
};