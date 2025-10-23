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

  public isLoggedIn = signal<boolean>(!!localStorage.getItem('token'));
  public currentUser = signal<any>(null);

  constructor(private http: HttpClient) {
    const userData = localStorage.getItem('user');
    if (userData) this.currentUser.set(JSON.parse(userData));
  }

  // 👇 Adaptado: tu back usa "nombre" y "password"
  login(nombre: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { nombre, password }).pipe(
      tap((res) => {
        if (res && res.token) {
          const token = String(res.token).replace(/^Bearer\s+/i, '').trim();

          // Guardar token y usuario
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(res.user));

          this.isLoggedIn.set(true);
          this.currentUser.set(res.user);
          console.debug('AuthService.login: Token almacenado correctamente');
          
        } else {
          console.error('AuthService.login: No se encontró token en la respuesta', res);
        }
      })
    );
  }

  // Obtener token almacenado
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Comprobar si hay sesión activa
  isLogged(): boolean {
    return this.isLoggedIn();
  }

  // Cerrar sesión (también podrías hacer POST /logout al back)
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
  }

  // Obtener usuario actual desde storage
  getCurrentUser(): any {
    return this.currentUser();
  }
}
