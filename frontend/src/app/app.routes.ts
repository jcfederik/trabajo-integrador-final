// routes.ts
import { Routes } from '@angular/router';
import { authMatchGuard } from './services/auth-guard'; // ver abajo

export const routes: Routes = [
  // Públicas
  { path: 'login', loadComponent: () => import('./components/login/login').then(m => m.Login) },

  // Privadas (SOLO canMatch)
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard').then(m => m.DashboardComponent),
    canMatch: [authMatchGuard],
  },
  {
    path: 'clientes',
    loadComponent: () => import('./components/clientes/clientes.component').then(m => m.ClientesComponent),
    canMatch: [authMatchGuard],
  },
  {
    path: 'equipos',
    loadComponent: () => import('./components/equipos/equipos.component').then(m => m.EquiposComponent),
    canMatch: [authMatchGuard],
  },
  {
    path: 'reparaciones',
    loadComponent: () => import('./components/reparaciones/reparaciones.component').then(m => m.ReparacionesComponent),
    canMatch: [authMatchGuard],
  },
  {
    path: 'facturas',
    loadComponent: () => import('./components/facturas/facturas').then(m => m.FacturasComponent),
    canMatch: [authMatchGuard],
  },
  { path: 'presupuestos',
    loadComponent: () => import('./components/presupuestos/presupuestos')
      .then(m => m.PresupuestosComponent),
    canMatch: [authMatchGuard] // o lo que uses
  },

  { path: 'medios-cobro',
    loadComponent: () => import('./components/medios-cobro/medios-cobro')
      .then(m => m.MediosCobroComponent),
    canMatch: [authMatchGuard]
  },

  { path: 'repuestos',
    loadComponent: () => import('./components/repuestos/repuestos.component')
      .then(m => m.RepuestosComponent),
    canMatch: [authMatchGuard]
  },

  // Redirect raíz
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  // Wildcard → login (no a dashboard)
  { path: '**', redirectTo: 'login' },
];
