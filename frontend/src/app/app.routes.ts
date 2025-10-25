import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard';
import { ClientesComponent } from './components/clientes/clientes.component';
import { authGuard } from './services/auth-guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./components/login/login').then(m => m.Login) },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'clientes', component: ClientesComponent, canActivate: [authGuard] },
  { path: 'equipos', loadComponent: () => import('./components/equipos/equipos').then(m => m.EquiposComponent), canActivate: [authGuard] },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
