import { Routes } from '@angular/router';
import { authMatchGuard, permissionGuard, loginBlockGuard } from './services/auth-guard';

export const routes: Routes = [
  // Públicas
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent),
    canMatch: [loginBlockGuard]
  },
  
  // Privadas con permisos específicos
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard').then(m => m.DashboardComponent),
    canMatch: [authMatchGuard], // Solo verifica autenticación
  },
  {
    path: 'clientes',
    loadComponent: () => import('./components/clientes/clientes.component').then(m => m.ClientesComponent),
    canMatch: [permissionGuard],
    data: { permission: 'clients.view' }
  },
  {
    path: 'equipos',
    loadComponent: () => import('./components/equipos/equipos.component').then(m => m.EquiposComponent),
    canMatch: [permissionGuard],
    data: { permission: 'equipos.view' }
  },
  {
    path: 'reparaciones',
    loadComponent: () => import('./components/reparaciones/reparaciones.component').then(m => m.ReparacionesComponent),
    canMatch: [permissionGuard],
    data: { permission: 'reparaciones.view' }
  },
  {
    path: 'facturas',
    loadComponent: () => import('./components/facturas/facturas').then(m => m.FacturasComponent),
    canMatch: [permissionGuard],
    data: { permission: 'facturas.view' }
  },
  {
    path: 'presupuestos',
    loadComponent: () => import('./components/presupuestos/presupuestos')
      .then(m => m.PresupuestosComponent),
    canMatch: [permissionGuard],
    data: { permission: 'presupuestos.view' }
  },
  {
    path: 'repuestos',
    loadComponent: () => import('./components/repuestos/repuestos.component')
      .then(m => m.RepuestosComponent),
    canMatch: [permissionGuard],
    data: { permission: 'repuestos.view' }
  },
  {
    path: 'proveedores',
    loadComponent: () => import('./components/proveedores/proveedores.component')
      .then(m => m.ProveedoresComponent),
    canMatch: [permissionGuard],
    data: { permission: 'proveedores.manage' }
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./components/usuarios/usuarios.component')
      .then(m => m.UsuariosComponent),
    canMatch: [permissionGuard],
    data: { permission: 'users.manage' }
  },
  {
    path: 'especializaciones',
    loadComponent: () => import('./components/especializaciones/especializaciones.component')
      .then(m => m.EspecializacionesComponent),
    canMatch: [permissionGuard],
    data: { permission: 'especializaciones.manage' }
  },

  // Redirect raíz
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  // Wildcard → login (no a dashboard)
  { path: '**', redirectTo: 'login' },
];