import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AlertService } from './alert.service';

// ====== INTERFACES ======
export interface Reparacion {
  id: number;
  descripcion: string;
  fecha: string;
  fecha_estimada?: string | null;
  estado: string;
  equipo_id: number;
  usuario_id: number;

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

  equipo_nombre?: string;
  cliente_nombre?: string;
  tecnico_nombre?: string;
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
  
  constructor(
    private http: HttpClient,
    private alertService: AlertService
  ) {}

  // ====== LISTADO PAGINADO ======
  list(page = 1, perPage = 10, search: string = ''): Observable<PaginatedResponse<Reparacion>> {
    let params = new HttpParams()
      .set('page', page)
      .set('per_page', perPage);

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PaginatedResponse<Reparacion>>(this.base, { params }).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudieron cargar las reparaciones');
        throw error;
      })
    );
  }

  // ====== LISTADO COMPLETO ======
  listCompleto(page = 1, perPage = 10, search: string = ''): Observable<PaginatedResponse<Reparacion>> {
    let params = new HttpParams()
      .set('page', page)
      .set('per_page', perPage);

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PaginatedResponse<Reparacion>>(`${this.base}/completo`, { params }).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudieron cargar las reparaciones completas');
        throw error;
      })
    );
  }

  // ====== MOSTRAR UNA REPARACIÓN ======
  show(id: number): Observable<Reparacion> {
    return this.http.get<Reparacion>(`${this.base}/${id}`).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudo cargar la reparación');
        throw error;
      })
    );
  }

  // ====== CREAR ======
  create(payload: Partial<Reparacion>): Observable<Reparacion> {
    return this.http.post<Reparacion>(this.base, payload).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudo crear la reparación');
        throw error;
      })
    );
  }

  // ====== EDITAR ======
  update(id: number, payload: Partial<Reparacion>): Observable<Reparacion> {
    return this.http.put<Reparacion>(`${this.base}/${id}`, payload).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudo actualizar la reparación');
        throw error;
      })
    );
  }

  // ====== ELIMINAR ======
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudo eliminar la reparación');
        throw error;
      })
    );
  }

  // ====== BUSCADOR ======
  buscarReparaciones(termino: string): Observable<Reparacion[]> {
    if (!termino || termino.trim() === '') {
      return of([]);
    }

    const terminoLimpio = termino.trim();
    const params = new HttpParams()
      .set('q', terminoLimpio)
      .set('per_page', '20');

    return this.http.get<any>(`${this.base}/buscar`, { params }).pipe(
      map(response => {
        let reparaciones: Reparacion[] = [];
        
        if (response && response.data && Array.isArray(response.data)) {
          reparaciones = response.data;
        } else if (Array.isArray(response)) {
          reparaciones = response;
        } else if (response && Array.isArray(response.items)) {
          reparaciones = response.items;
        }
                
        return reparaciones.map(rep => this.procesarParaBuscador(rep));
      }),
      catchError(() => this.buscarReparacionesFallback(terminoLimpio))
    );
  }

  private buscarReparacionesFallback(termino: string): Observable<Reparacion[]> {
    const params = new HttpParams()
      .set('search', termino)
      .set('per_page', '100');
    
    return this.http.get<PaginatedResponse<Reparacion>>(`${this.base}/completo`, { params }).pipe(
      map(response => {
        const data = response.data || [];
        const terminoLower = termino.toLowerCase();
        const filtradas = data.filter(rep =>
          (rep.descripcion || '').toLowerCase().includes(terminoLower) ||
          (rep.estado || '').toLowerCase().includes(terminoLower) ||
          (rep.equipo?.descripcion || rep.equipo_nombre || '').toLowerCase().includes(terminoLower) ||
          (rep.tecnico?.nombre || rep.tecnico_nombre || '').toLowerCase().includes(terminoLower) ||
          (rep.equipo?.cliente?.nombre || rep.cliente_nombre || '').toLowerCase().includes(terminoLower) ||
          rep.id.toString().includes(termino)
        );
        
        return filtradas.map(rep => this.procesarParaBuscador(rep));
      }),
      catchError(() => of([]))
    );
  }

  // ====== FORMATEO PARA AUTOCOMPLETE ======
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

  // ====== GESTIÓN DE REPUESTOS ======
  assignRepuesto(reparacionId: number, repuestoId: number, cantidad: number = 1): Observable<any> {
    return this.http.post(`${this.base}/${reparacionId}/repuestos`, {
      repuesto_id: repuestoId,
      cantidad: cantidad
    }).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudo asignar el repuesto');
        throw error;
      })
    );
  }

  removeRepuesto(reparacionId: number, pivotId: number): Observable<any> {
    return this.http.delete(`${this.base}/${reparacionId}/repuestos/${pivotId}`).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudo remover el repuesto');
        throw error;
      })
    );
  }

  getRepuestosAsignados(reparacionId: number): Observable<any> {
    return this.http.get(`${this.base}/${reparacionId}/repuestos`).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudieron cargar los repuestos asignados');
        throw error;
      })
    );
  }
}