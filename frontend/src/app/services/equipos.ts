// src/app/services/equipo.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Equipo {
  id: number;
  cliente_id: number;
  descripcion: string;
  marca?: string;
  modelo?: string;
  nro_serie?: string;
  created_at?: string;
  updated_at?: string;
  cliente?: any; // Para cuando se incluye la relación con cliente
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

// 🔥 Interfaz para la respuesta paginada
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
  next_page_url?: string | null;
}

@Injectable({ providedIn: 'root' })
export class EquipoService {
  private apiUrl = 'http://127.0.0.1:8000/api/equipos';

  constructor(private http: HttpClient) {}

  // 🔹 Obtener equipos paginados
  getEquipos(page: number = 1, perPage: number = 15): Observable<PaginatedResponse<Equipo>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<PaginatedResponse<Equipo>>(this.apiUrl, { params });
  }

  // 🔹 Obtener equipo por ID
  getEquipo(id: number): Observable<Equipo> {
    return this.http.get<Equipo>(`${this.apiUrl}/${id}`);
  }

  // 🔹 Crear equipo
  createEquipo(equipo: Partial<Equipo>): Observable<Equipo> {
    return this.http.post<Equipo>(this.apiUrl, equipo);
  }

  // 🔹 Actualizar equipo
  updateEquipo(id: number, equipo: Partial<Equipo>): Observable<Equipo> {
    return this.http.put<Equipo>(`${this.apiUrl}/${id}`, equipo);
  }

  // 🔹 Eliminar equipo
  deleteEquipo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // 🔹 BUSCAR EQUIPOS (para el search-selector)
  buscarEquipos(termino: string): Observable<SearchResult[]> {
    let params = new HttpParams();
    
    if (termino && termino.trim().length > 0) {
      params = params.set('search', termino.trim());
    }

    return this.http.get<SearchResult[]>(`${this.apiUrl}/buscar`, { params });
  }

  // 🔹 BUSCAR EQUIPOS POR CLIENTE (para el formulario de reparaciones)
  buscarEquiposPorCliente(clienteId: number): Observable<SearchResult[]> {
    let params = new HttpParams().set('cliente_id', clienteId.toString());
    
    return this.http.get<SearchResult[]>(`${this.apiUrl}/buscar`, { params });
  }

  // 🔹 BUSCAR EQUIPOS con filtro por cliente y término
  buscarEquiposConFiltro(termino: string, clienteId?: number): Observable<SearchResult[]> {
    let params = new HttpParams();
    
    if (termino && termino.trim().length > 0) {
      params = params.set('search', termino.trim());
    }
    
    if (clienteId) {
      params = params.set('cliente_id', clienteId.toString());
    }

    return this.http.get<SearchResult[]>(`${this.apiUrl}/buscar`, { params });
  }

  // 🔹 Obtener equipos de un cliente específico (sin búsqueda)
  getEquiposPorCliente(clienteId: number, page: number = 1, perPage: number = 50): Observable<PaginatedResponse<Equipo>> {
    let params = new HttpParams()
      .set('cliente_id', clienteId.toString())
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<PaginatedResponse<Equipo>>(`${this.apiUrl}/por-cliente`, { params });
  }
}