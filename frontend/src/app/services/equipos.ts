import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SearchResult } from '../components/search-selector/search-selector.component';

export interface Equipo {
  id: number;
  cliente_id: number;
  descripcion: string;
  marca?: string;
  modelo?: string;
  nro_serie?: string;
  created_at?: string;
  updated_at?: string;
  cliente?: any;
}

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
      params = params.set('q', termino.trim());
    }

    return this.http.get<SearchResult[]>(`${this.apiUrl}/buscar`, { params }).pipe(
      catchError(error => {
        console.warn('Error en búsqueda específica de equipos:', error);
        return of([]);
      })
    );
  }

  // 🔹 BUSCAR EQUIPOS POR CLIENTE (CORREGIDO - usando el listado general)
  buscarEquiposPorCliente(clienteId: number): Observable<SearchResult[]> {
    // Obtener TODOS los equipos y filtrar por cliente_id localmente
    return this.getEquipos(1, 1000).pipe( // Número alto para obtener todos
      map(response => {
        const equipos = response.data;
        // Filtrar equipos del cliente específico
        const equiposDelCliente = equipos.filter(equipo => equipo.cliente_id === clienteId);
        return equiposDelCliente.map(equipo => this.mapEquipoToSearchResult(equipo));
      }),
      catchError(error => {
        console.warn('Error cargando equipos del cliente:', error);
        return of([]);
      })
    );
  }

  // 🔹 BUSCAR EQUIPOS con filtro por cliente y término (CORREGIDO)
  buscarEquiposConFiltro(termino: string, clienteId?: number): Observable<SearchResult[]> {
    // Si hay clienteId, obtener sus equipos y filtrar localmente
    if (clienteId) {
      return this.buscarEquiposPorCliente(clienteId).pipe(
        map(equipos => {
          if (!termino.trim()) {
            return equipos; // Devolver todos si no hay término
          }
          
          // Filtrar localmente por término
          const t = termino.toLowerCase();
          return equipos.filter(equipo =>
            equipo.descripcion?.toLowerCase().includes(t) ||
            equipo.marca?.toLowerCase().includes(t) ||
            equipo.modelo?.toLowerCase().includes(t) ||
            equipo.nro_serie?.toLowerCase().includes(t)
          );
        })
      );
    }

    // Si no hay clienteId, buscar equipos generales
    return this.buscarEquipos(termino);
  }

  // 🔹 Mapear Equipo a SearchResult
  private mapEquipoToSearchResult(equipo: Equipo): SearchResult {
    return {
      id: equipo.id,
      descripcion: equipo.descripcion,
      marca: equipo.marca,
      modelo: equipo.modelo,
      nro_serie: equipo.nro_serie,
      cliente_id: equipo.cliente_id,
      nombre: equipo.cliente?.nombre // Para compatibilidad
    };
  }


}