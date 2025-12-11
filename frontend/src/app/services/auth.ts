import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

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

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');

  if (!token || !userData) {
    this.clearAuthData();
    return;
  }

  // ⛔ Validar token ANTES de cargar usuario
  if (!this.isTokenValid(token)) {
    console.warn('Token inválido o expirado al cargar desde storage.');
    this.clearAuthData();
    return;
  }

  try {
    const user = JSON.parse(userData);
    this.currentUser.set(user);
    this.isLoggedIn.set(true);
    console.debug('AuthService: Usuario restaurado correctamente');
  } catch (err) {
    console.error('Error parseando usuario desde storage:', err);
    this.clearAuthData();
  }
}


  // ✅ MÉTODOS DE PERMISOS - COINCIDEN CON BACKEND
  getUserPermissions(): string[] {
    const user = this.currentUser();
    // ✅ El backend ya envía los permisos en el atributo 'permissions'
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

  // ✅ MÉTODOS HELPER PARA ROLES - COINCIDEN CON BACKEND
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

  // ✅ MÉTODOS ESPECÍFICOS PARA ESPECIALIZACIONES
  canManageEspecializaciones(): boolean {
    // ✅ Según tu backend: administradores y técnicos pueden gestionar
    return this.hasPermission('especializaciones.manage') ||
      this.hasPermission('especializaciones.create') ||
      this.isAdmin() ||
      this.isTecnico();
  }

  canViewEspecializaciones(): boolean {
    // ✅ Todos los tipos de usuarios pueden ver especializaciones según tu backend
    return this.hasAnyPermission([
      'especializaciones.manage',
      'especializaciones.view',
      'especializaciones.create',
      'especializaciones.self_assign'
    ]) || this.isAdmin() || this.isTecnico() || this.isUsuario();
  }

  canAssignEspecializaciones(): boolean {
    // ✅ Solo administradores pueden asignar a otros usuarios
    return this.isAdmin();
  }

  canSelfAssignEspecializaciones(): boolean {
    // ✅ Técnicos pueden auto-asignarse
    return this.hasPermission('especializaciones.self_assign') || this.isTecnico();
  }

  // ====== LOGIN ======
  login(nombre: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { nombre, password }).pipe(
      tap((res) => {
        if (res && res.token) {
          const token = String(res.token).replace(/^Bearer\s+/i, '').trim();

          // ✅ EL BACKEND YA ENVÍA LOS PERMISOS - NO NECESITAMOS MAPEAR
          const user = res.user;

          // Guardar token y usuario
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          this.isLoggedIn.set(true);
          this.currentUser.set(user);

          console.debug('AuthService.login: Usuario autenticado', {
            user: user,
            tipo: user.tipo,
            permissions: user.permissions
          });

        } else {
          console.error('AuthService.login: No se encontró token en la respuesta', res);
          throw new Error('Invalid login response');
        }
      })
    );
  }

  // ====== TOKEN MANAGEMENT ======
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

    // Solo llamar al backend si el token es válido
    if (token && this.isTokenValid(token)) {
      this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
        next: () => console.log('Logout backend OK'),
        error: () => console.warn('Logout backend falló (token inválido)')
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

  // ====== USER MANAGEMENT ======
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