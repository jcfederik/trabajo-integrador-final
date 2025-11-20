import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface Reparacion {
  id: number;
  descripcion: string;
  fecha: string;
  estado: string;

  equipo_id: number;
  usuario_id: number;

  // Relaciones completas
  equipo?: {
    id: number;
    descripcion: string;
    marca?: string;
    modelo?: string;
    nro_serie?: string;
    cliente_id?: number; 
    cliente?: {
      id: number;
      nombre: string;
      telefono?: string;
      email?: string;
    };
  };



  tecnico?: {
    id: number;
    nombre: string;
    email?: string;
  };

  // Campos calculados por el backend
  equipo_nombre?: string;
  cliente_nombre?: string;
  tecnico_nombre?: string;

  // Para buscador – opcional
  displayText?: string;
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
export class ReparacionService {
  private base = 'http://127.0.0.1:8000/api/reparaciones';
  private baseCompleto = 'http://127.0.0.1:8000/api/reparaciones/completo';
  constructor(private http: HttpClient) {}

  // ============================================================
  // ▓▓▓   LISTADO PAGINADO (normal)   ▓▓▓
  // ============================================================
  list(page = 1, perPage = 10, search: string = ''): Observable<PaginatedResponse<Reparacion>> {
    let params = new HttpParams()
      .set('page', page)
      .set('per_page', perPage);

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PaginatedResponse<Reparacion>>(this.base, { params });
  }

  // ============================================================
  // ▓▓▓   MOSTRAR UNA REPARACIÓN   ▓▓▓
  // ============================================================
  show(id: number): Observable<Reparacion> {
    return this.http.get<Reparacion>(`${this.base}/${id}`);
  }

  // ============================================================
  // ▓▓▓   CREAR   ▓▓▓
  // ============================================================
  create(payload: Partial<Reparacion>): Observable<Reparacion> {
    return this.http.post<Reparacion>(this.base, payload);
  }

  // ============================================================
  // ▓▓▓   EDITAR   ▓▓▓
  // ============================================================
  update(id: number, payload: Partial<Reparacion>): Observable<Reparacion> {
    return this.http.put<Reparacion>(`${this.base}/${id}`, payload);
  }

  // ============================================================
  // ▓▓▓   ELIMINAR   ▓▓▓
  // ============================================================
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  // ============================================================
  // ▓▓▓   LISTADO COMPLETO (con equipo, cliente y técnico)   ▓▓▓
  // ============================================================
listCompleto(page = 1, perPage = 10, search: string = ''): Observable<PaginatedResponse<Reparacion>> {
    let params = new HttpParams()
      .set('page', page)
      .set('per_page', perPage);

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    // 👇 ESTE ERA EL PROBLEMA
    return this.http.get<PaginatedResponse<Reparacion>>(this.baseCompleto, { params });
  }


  // ============================================================
  // ▓▓▓   BUSCADOR (autocomplete)   ▓▓▓
  // ============================================================
  buscarReparaciones(termino: string): Observable<Reparacion[]> {
    if (!termino.trim()) return of([]);

    const params = new HttpParams()
      .set('search', termino.trim())
      .set('per_page', '100');

    return this.http.get<PaginatedResponse<Reparacion>>(this.base, { params }).pipe(
      map(resp => resp.data.map(rep => this.procesarParaBuscador(rep))),
      catchError(() => this.buscarReparacionesFallback(termino))
    );
  }

  private buscarReparacionesFallback(termino: string): Observable<Reparacion[]> {
    const params = new HttpParams().set('per_page', '100');

    return this.http.get<PaginatedResponse<Reparacion>>(this.base, { params }).pipe(
      map(resp => {
        const t = termino.toLowerCase();
        const filtradas = resp.data.filter(rep =>
          rep.descripcion?.toLowerCase().includes(t) ||
          rep.estado?.toLowerCase().includes(t) ||
          rep.equipo?.descripcion?.toLowerCase().includes(t) ||
          rep.tecnico?.nombre?.toLowerCase().includes(t) ||
          rep.equipo?.cliente?.nombre?.toLowerCase().includes(t)
        );
        return filtradas.map(rep => this.procesarParaBuscador(rep));
      })
    );
  }

  // ============================================================
  // ▓▓▓   FORMATEO PARA AUTOCOMPLETE (displayText)   ▓▓▓
  // ============================================================
  private procesarParaBuscador(rep: Reparacion): Reparacion {
    const equipoNombre = rep.equipo?.descripcion || 'Sin equipo';
    const tecnicoNombre = rep.tecnico?.nombre || 'Sin técnico';
    const clienteNombre = rep.equipo?.cliente?.nombre || 'No especificado';
    const fecha = rep.fecha ? new Date(rep.fecha).toLocaleDateString() : 'Sin fecha';

    return {
      ...rep,
      equipo_nombre: equipoNombre,
      tecnico_nombre: tecnicoNombre,
      cliente_nombre: clienteNombre,
      displayText: `#${rep.id} - ${rep.descripcion} | ${equipoNombre} | ${tecnicoNombre} | ${fecha}`
    };
  }
}
