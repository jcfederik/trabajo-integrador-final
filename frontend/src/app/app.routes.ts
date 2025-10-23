import { Routes, provideRouter } from '@angular/router'; 
import { Login } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
export const routes: Routes = [  
{ path: 'login', component: Login },
{ path: 'dashboard', component: DashboardComponent },

]; 