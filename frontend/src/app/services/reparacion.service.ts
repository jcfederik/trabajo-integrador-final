import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface Reparacion {
  id: number;
  descripcion: string;
  fecha: string;
  fecha_estimada?: string | null;
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

  repuestos?: {
    id: number;
    nombre: string;
    stock: number;
    costo_base: number;
    pivot?: {
      id: number;
      cantidad: number;
      costo_unitario: number;
    };
  }[];

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

export interface CreateReparacionResponse {
  mensaje: string;
  reparacion: Reparacion;
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
  // ▓▓▓   LISTADO COMPLETO (con equipo, cliente y técnico)   ▓▓▓
  // ============================================================
  listCompleto(page = 1, perPage = 10, search: string = ''): Observable<PaginatedResponse<Reparacion>> {
    let params = new HttpParams()
      .set('page', page)
      .set('per_page', perPage);

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PaginatedResponse<Reparacion>>(`${this.base}/completo`, { params });
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
  // ▓▓▓   BUSCADOR (autocomplete) - CORREGIDO   ▓▓▓
  // ============================================================
  buscarReparaciones(termino: string): Observable<Reparacion[]> {
    if (!termino.trim()) return of([]);

    const params = new HttpParams()
      .set('q', termino.trim()) 
      .set('per_page', '20');

    return this.http.get<PaginatedResponse<Reparacion>>(`${this.base}/buscar`, { params }).pipe(
      map(resp => {
        const data = resp.data || [];
        return data.map(rep => this.procesarParaBuscador(rep));
      }),
      catchError((error) => {
        console.error('Error en /buscar, intentando fallback:', error);
        return this.buscarReparacionesFallback(termino);
      })
    );
  }


  private buscarReparacionesFallback(termino: string): Observable<Reparacion[]> {
    const t = termino.toLowerCase();
    const params = new HttpParams()
      .set('search', t)  // Usar 'search' para /completo
      .set('per_page', '100');

    return this.http.get<PaginatedResponse<Reparacion>>(`${this.base}/completo`, { params }).pipe(
      map(resp => {
        const filtradas = resp.data.filter(rep =>
          (rep.descripcion || '').toLowerCase().includes(t) ||
          (rep.estado || '').toLowerCase().includes(t) ||
          (rep.equipo?.descripcion || rep.equipo_nombre || '').toLowerCase().includes(t) ||
          (rep.tecnico?.nombre || rep.tecnico_nombre || '').toLowerCase().includes(t) ||
          (rep.equipo?.cliente?.nombre || rep.cliente_nombre || '').toLowerCase().includes(t) ||
          rep.id.toString().includes(t)
        );

        return filtradas.map(rep => this.procesarParaBuscador(rep));
      }),
      catchError(() => of([]))
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
    const fechaEst = rep.fecha_estimada 
      ? new Date(rep.fecha_estimada).toLocaleDateString() 
      : 'Sin estimada';

    return {
      ...rep,
      equipo_nombre: equipoNombre,
      tecnico_nombre: tecnicoNombre,
      cliente_nombre: clienteNombre,
      displayText: `#${rep.id} - ${rep.descripcion} | ${equipoNombre} | ${tecnicoNombre} | ${fecha} | Est.: ${fechaEst}`
    };
  }

  // ============================================================
  // ▓▓▓   GESTIÓN DE REPUESTOS EN REPARACIONES   ▓▓▓
  // ============================================================

  assignRepuesto(reparacionId: number, repuestoId: number, cantidad: number = 1): Observable<any> {
    return this.http.post(`${this.base}/${reparacionId}/repuestos`, {
      repuesto_id: repuestoId,
      cantidad: cantidad
    });
  }

  removeRepuesto(reparacionId: number, pivotId: number): Observable<any> {
    return this.http.delete(`${this.base}/${reparacionId}/repuestos/${pivotId}`);
  }

  // Obtener repuestos asignados a una reparación
  getRepuestosAsignados(reparacionId: number): Observable<any> {
    return this.http.get(`${this.base}/${reparacionId}/repuestos`);
  }
}