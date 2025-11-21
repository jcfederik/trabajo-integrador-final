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

  // ====== LOGIN ======
  login(nombre: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { nombre, password }).pipe(
      tap((res) => {
        if (res && res.token) {
          const token = String(res.token).replace(/^Bearer\s+/i, '').trim();
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(res.user));
          this.isLoggedIn.set(true);
          this.currentUser.set(res.user);
        }
      })
    );
  }

  // ====== TOKEN MANAGEMENT ======
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    const t = this.getToken();
    if (!t) return false;
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload?.exp ? payload.exp > now : true;
    } catch {
      return false;
    }
  }

  // ====== LOGOUT ======
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
  }

  // ====== USER MANAGEMENT ======
  getCurrentUser(): any {
    return this.currentUser();
  }
}