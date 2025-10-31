import { Routes } from '@angular/router';
import { authGuard } from './services/auth-guard';

export const routes: Routes = [
  // Públicas
  { path: 'login', loadComponent: () => import('./components/login/login').then(m => m.Login) },

  // Privadas (protegidas con guard)
  { path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard').then(m => m.DashboardComponent), canActivate: [authGuard] },
  { path: 'clientes', loadComponent: () => import('./components/clientes/clientes.component').then(m => m.ClientesComponent), canActivate: [authGuard] },
  { path: 'equipos', loadComponent: () => import('./components/equipos/equipos').then(m => m.EquiposComponent), canActivate: [authGuard] },
  { path: 'reparaciones', loadComponent: () => import('./components/reparaciones/reparaciones.component').then(m => m.ReparacionesComponent), canActivate: [authGuard] },

  // Redirect raíz → dashboard (protegido)
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  // Wildcard al final
  { path: '**', redirectTo: 'dashboard' }
];
