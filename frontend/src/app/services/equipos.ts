import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SearchResult } from '../components/search-selector/search-selector.component';
import { AlertService } from './alert.service';

// ====== INTERFACES ======
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

  constructor(
    private http: HttpClient,
    private alertService: AlertService
  ) {}

  // ====== OPERACIONES CRUD ======
  getEquipos(page: number = 1, perPage: number = 15): Observable<PaginatedResponse<Equipo>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<PaginatedResponse<Equipo>>(this.apiUrl, { params }).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudieron cargar los equipos');
        throw error;
      })
    );
  }

  getEquipo(id: number): Observable<Equipo> {
    return this.http.get<Equipo>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudo cargar el equipo');
        throw error;
      })
    );
  }

  createEquipo(equipo: Partial<Equipo>): Observable<Equipo> {
    return this.http.post<Equipo>(this.apiUrl, equipo).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudo crear el equipo');
        throw error;
      })
    );
  }

  updateEquipo(id: number, equipo: Partial<Equipo>): Observable<Equipo> {
    return this.http.put<Equipo>(`${this.apiUrl}/${id}`, equipo).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudo actualizar el equipo');
        throw error;
      })
    );
  }

  deleteEquipo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudo eliminar el equipo');
        throw error;
      })
    );
  }

  // ====== OPERACIONES DE BÚSQUEDA ======
  buscarEquipos(termino: string): Observable<SearchResult[]> {
    let params = new HttpParams();
    
    if (termino && termino.trim().length > 0) {
      params = params.set('q', termino.trim());
    }

    return this.http.get<SearchResult[]>(`${this.apiUrl}/buscar`, { params }).pipe(
      catchError(() => of([]))
    );
  }

  buscarEquiposPorCliente(clienteId: number): Observable<SearchResult[]> {
    return this.getEquipos(1, 1000).pipe(
      map(response => {
        const equipos = response.data;
        const equiposDelCliente = equipos.filter(equipo => equipo.cliente_id === clienteId);
        return equiposDelCliente.map(equipo => this.mapEquipoToSearchResult(equipo));
      }),
      catchError(() => of([]))
    );
  }

  buscarEquiposConFiltro(termino: string, clienteId?: number): Observable<SearchResult[]> {
    if (clienteId) {
      return this.buscarEquiposPorCliente(clienteId).pipe(
        map(equipos => {
          if (!termino.trim()) {
            return equipos;
          }
          
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

    return this.buscarEquipos(termino);
  }

  private mapEquipoToSearchResult(equipo: Equipo): SearchResult {
    return {
      id: equipo.id,
      descripcion: equipo.descripcion,
      marca: equipo.marca,
      modelo: equipo.modelo,
      nro_serie: equipo.nro_serie,
      cliente_id: equipo.cliente_id,
      nombre: equipo.cliente?.nombre
    };
  }
}