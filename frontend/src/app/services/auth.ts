import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AlertService } from './alert.service';

// ====== INTERFACES ======
interface LoginResponse {
  message: string;
  user: any;
  token: string;
  token_type: string;
  expires_in: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  public isLoggedIn = signal<boolean>(this.isAuthenticated());
  public currentUser = signal<any>(null);

  constructor(
    private http: HttpClient,
    private alertService: AlertService
  ) {
    this.loadUserFromStorage();
  }

  // ====== CARGA INICIAL DESDE STORAGE ======
  private loadUserFromStorage(): void {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      this.clearAuthData();
      return;
    }

    if (!this.isTokenValid(token)) {
      this.clearAuthData();
      return;
    }

    try {
      const user = JSON.parse(userData);
      this.currentUser.set(user);
      this.isLoggedIn.set(true);
    } catch {
      this.clearAuthData();
    }
  }

  // ====== GESTIÓN DE PERMISOS ======
  getUserPermissions(): string[] {
    const user = this.currentUser();
    return user?.permissions || [];
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUser();

    if(this.isAdmin()){
      return true;
    }

    if (user && typeof user.hasPermission === 'function') {
      return user.hasPermission(permission);
    }
    return this.getUserPermissions().includes(permission);
  }

  hasAnyPermission(permissions: string[]): boolean {
    if(this.isAdmin()){
      return true;
    }
    return permissions.some(permission => this.hasPermission(permission));
  }

  // ====== GESTIÓN DE ROLES ======
  isAdmin(): boolean {
    const user = this.currentUser();
    return user?.tipo === 'administrador' || user?.isAdmin?.() === true;
  }

  isUsuario(): boolean {
    const user = this.currentUser();
    return user?.tipo === 'usuario' || user?.isUsuario?.() === true;
  }

  isTecnico(): boolean {
    const user = this.currentUser();
    return user?.tipo === 'tecnico' || user?.isTecnico?.() === true;
  }

  // ====== PERMISOS ESPECÍFICOS PARA ESPECIALIZACIONES ======
  canManageEspecializaciones(): boolean {
    return this.hasPermission('especializaciones.manage') ||
      this.hasPermission('especializaciones.create') ||
      this.isAdmin() ||
      this.isTecnico();
  }

  canViewEspecializaciones(): boolean {
    return this.hasAnyPermission([
      'especializaciones.manage',
      'especializaciones.view',
      'especializaciones.create',
      'especializaciones.self_assign'
    ]) || this.isAdmin() || this.isTecnico() || this.isUsuario();
  }

  canAssignEspecializaciones(): boolean {
    return this.isAdmin();
  }

  canSelfAssignEspecializaciones(): boolean {
    return this.hasPermission('especializaciones.self_assign') || this.isTecnico();
  }

  // ====== AUTENTICACIÓN ======
  login(nombre: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { nombre, password }).pipe(
      tap((res) => {
        if (res && res.token) {
          const token = String(res.token).replace(/^Bearer\s+/i, '').trim();
          const user = res.user;

          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          this.isLoggedIn.set(true);
          this.currentUser.set(user);
        } else {
          this.alertService.showError('Error', 'Respuesta de login inválida');
          throw new Error('Invalid login response');
        }
      })
    );
  }

  // ====== GESTIÓN DE TOKENS ======
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && this.isTokenValid(token);
  }

  // ====== LOGOUT ======
  logout(): void {
    const token = this.getToken();

    if (token && this.isTokenValid(token)) {
      this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
        error: () => this.alertService.showError('Error', 'No se pudo cerrar sesión en el servidor')
      });
    }

    this.clearAuthData();
  }

  private clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
  }

  // ====== GESTIÓN DE USUARIO ======
  getCurrentUser(): any {
    return this.currentUser();
  }

  private isTokenValid(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);

      return !(payload.exp && payload.exp < now);
    } catch {
      return false;
    }
  }
}