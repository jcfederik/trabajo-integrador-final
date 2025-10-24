import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getToken();
  const isLogged = auth.isLogged();

  if (token && isLogged) {
    return true; // ✅ Usuario autenticado → continuar
  } else {
    console.warn('⚠️ No autenticado, redirigiendo al login...');
    router.navigate(['/login']);
    return false;
  }
};
