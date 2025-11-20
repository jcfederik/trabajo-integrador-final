import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Usuario {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  tipo?: string;
  nombre?: string; // Para compatibilidad con SearchResult
}

export interface SearchResult {
  id: number;
  nombre?: string;
  descripcion?: string;
  email?: string;
  telefono?: string;
  tipo?: string;
  marca?: string;
  modelo?: string;
  nro_serie?: string;
  cliente_id?: number;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private apiUrl = 'http://127.0.0.1:8000/api/usuarios'; 

  constructor(private http: HttpClient) {}

  // Buscar usuarios/técnicos por nombre
  buscarUsuarios(termino: string): Observable<Usuario[]> {
    const params = new HttpParams().set('q', termino);
    return this.http.get<Usuario[]>(`${this.apiUrl}/buscar`, { params });
  }

  // 🔹 NUEVO MÉTODO: Buscar específicamente técnicos
  buscarTecnicos(termino: string): Observable<SearchResult[]> {
    const params = new HttpParams().set('q', termino);
    return this.http.get<SearchResult[]>(`${this.apiUrl}/buscar`, { params });
  }

  // 🔹 NUEVO MÉTODO: Obtener técnicos paginados
  getTecnicos(page: number = 1, perPage: number = 10): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<any>(`${this.apiUrl}?tipo=tecnico`, { params });
  }

  // Obtener todos los usuarios (para cuando no hay término)
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  // 🔹 NUEVO MÉTODO: Obtener usuarios paginados
  getUsuariosPaginados(page: number = 1, perPage: number = 15): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<any>(this.apiUrl, { params });
  }

  // 🔹 NUEVO MÉTODO: Cargar usuarios iniciales (para precarga)
  cargarUsuariosIniciales(limit: number = 5): Observable<SearchResult[]> {
    const params = new HttpParams()
      .set('per_page', limit.toString())
      .set('page', '1');

    return this.http.get<SearchResult[]>(this.apiUrl, { params });
  }
}