import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Usuario {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  tipo?: string;
  nombre?: string;
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

  // ====== SEARCH OPERATIONS ======
  buscarUsuarios(termino: string): Observable<Usuario[]> {
    const params = new HttpParams().set('q', termino);
    return this.http.get<Usuario[]>(`${this.apiUrl}/buscar`, { params });
  }

  buscarTecnicos(termino: string): Observable<SearchResult[]> {
    const params = new HttpParams().set('q', termino);
    return this.http.get<SearchResult[]>(`${this.apiUrl}/buscar`, { params });
  }

  // ====== PAGINATED OPERATIONS ======
  getTecnicos(page: number = 1, perPage: number = 10): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<any>(`${this.apiUrl}?tipo=tecnico`, { params });
  }

  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  getUsuariosPaginados(page: number = 1, perPage: number = 15): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<any>(this.apiUrl, { params });
  }

  // ====== INITIAL DATA LOADING ======
  cargarUsuariosIniciales(limit: number = 5): Observable<SearchResult[]> {
    const params = new HttpParams()
      .set('per_page', limit.toString())
      .set('page', '1');

    return this.http.get<SearchResult[]>(this.apiUrl, { params });
  }
}