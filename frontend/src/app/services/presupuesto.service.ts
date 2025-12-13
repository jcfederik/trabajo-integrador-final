import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SearchableItem } from './busquedaglobal';

export interface Presupuesto extends SearchableItem {
  id: number;
  reparacion_id: number;
  fecha: string;
  monto_total: number | null;
  aceptado: boolean;
  reparacion?: {
    id: number;
    descripcion: string;
    equipo_id: number;
    usuario_id: number;
    fecha: string;
    estado: string;
    equipo?: any;
    tecnico?: any;
    equipo_nombre?: string;
    cliente_nombre?: string;
    tecnico_nombre?: string;
  };
  displayText?: string;
  reparacion_descripcion?: string;
  estado_legible?: string;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  next_page_url: string | null;
  prev_page_url: string | null;
  per_page: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class PresupuestoService {
  private base = 'http://127.0.0.1:8000/api/presupuestos';

  constructor(private http: HttpClient) {}

  // ====== MÉTODO AUXILIAR PARA OBTENER HEADERS ======
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });
  }

  // ====== CRUD OPERATIONS ======
  list(page = 1, perPage = 10): Observable<Paginated<Presupuesto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString())
      .set('with_reparacion', 'true')
      .set('with_relations', 'true');

    return this.http.get<Paginated<Presupuesto>>(this.base, { 
      params, 
      headers: this.getHeaders() 
    });
  }

  show(id: number): Observable<Presupuesto> {
    return this.http.get<Presupuesto>(`${this.base}/${id}`, { 
      headers: this.getHeaders() 
    });
  }

  create(payload: Partial<Presupuesto>) {
    return this.http.post(this.base, payload, { 
      headers: this.getHeaders() 
    });
  }

  update(id: number, payload: Partial<Presupuesto>) {
    return this.http.put(`${this.base}/${id}`, payload, { 
      headers: this.getHeaders() 
    });
  }

  delete(id: number) {
    return this.http.delete(`${this.base}/${id}`, { 
      headers: this.getHeaders() 
    });
  }

  // ====== SEARCH OPERATIONS ======
  buscarGlobal(termino: string): Observable<Presupuesto[]> {
    if (!termino.trim()) return of([]);

    const params = new HttpParams()
      .set('q', termino)
      .set('per_page', '100');

    return this.http.get<any>(`${this.base}/buscar`, { 
      params, 
      headers: this.getHeaders() 
    }).pipe(
      map(response => {
        let presupuestos: any[] = [];
        if (Array.isArray(response)) {
          presupuestos = response;
        } else if (response.data && Array.isArray(response.data)) {
          presupuestos = response.data;
        }
        return this.formatearPresupuestosParaBusqueda(presupuestos);
      }),
      catchError((error) => {
        console.error('Error en buscarGlobal:', error);
        return this.buscarPresupuestosFallback(termino);
      })
    );
  }

  buscarPresupuestos(termino: string): Observable<Presupuesto[]> {
    if (!termino.trim()) return of([]);

    const params = new HttpParams()
      .set('q', termino)
      .set('per_page', '100');

    return this.http.get<any>(`${this.base}/buscar`, { 
      params, 
      headers: this.getHeaders() 
    }).pipe(
      map(response => {
        console.log('Respuesta de /buscar:', response);
        const presupuestos = Array.isArray(response) ? response : [];
        return this.formatearPresupuestosParaBusqueda(presupuestos);
      }),
      catchError((error) => {
        console.error('Error en buscarPresupuestos:', error);
        return this.buscarPresupuestosFallback(termino);
      })
    );
  }

  // NUEVO MÉTODO: Buscar presupuestos por reparación
  buscarPorReparacion(reparacionId: number): Observable<Presupuesto[]> {
    if (!reparacionId) return of([]);

    const params = new HttpParams()
      .set('reparacion_id', reparacionId.toString())
      .set('per_page', '100')
      .set('with_reparacion', 'true');

    return this.http.get<any>(`${this.base}/buscar-por-reparacion`, { 
      params, 
      headers: this.getHeaders() 
    }).pipe(
      map(response => {
        let presupuestos: any[] = [];
        if (Array.isArray(response)) {
          presupuestos = response;
        } else if (response.data && Array.isArray(response.data)) {
          presupuestos = response.data;
        }
        return this.formatearPresupuestosParaBusqueda(presupuestos);
      }),
      catchError((error) => {
        console.error('Error en buscarPorReparacion:', error);
        // Fallback: buscar todos y filtrar por reparacion_id
        return this.buscarPresupuestosFallbackPorReparacion(reparacionId);
      })
    );
  }

  private buscarPresupuestosFallbackPorReparacion(reparacionId: number): Observable<Presupuesto[]> {
    return this.http.get<Paginated<Presupuesto>>(`${this.base}?per_page=100`, { 
      headers: this.getHeaders() 
    }).pipe(
      map(response => {
        const todosLosPresupuestos = response.data || [];
        const presupuestosFiltrados = todosLosPresupuestos.filter((presupuesto: Presupuesto) => {
          return presupuesto.reparacion_id === reparacionId;
        });
        return this.formatearPresupuestosParaBusqueda(presupuestosFiltrados);
      }),
      catchError(() => of([]))
    );
  }

  private buscarPresupuestosFallback(termino: string): Observable<Presupuesto[]> {
    return this.http.get<Paginated<Presupuesto>>(`${this.base}?per_page=100&with_reparacion=true`, { 
      headers: this.getHeaders() 
    }).pipe(
      map(response => {
        const todosLosPresupuestos = response.data || [];
        const terminoLower = termino.toLowerCase();
        
        const presupuestosFiltrados = todosLosPresupuestos.filter((presupuesto: Presupuesto) => {
          // Buscar en propiedades del presupuesto
          const enPropiedadesPresupuesto = (
            presupuesto.id.toString().includes(termino) ||
            (presupuesto.monto_total && presupuesto.monto_total.toString().includes(termino)) ||
            (presupuesto.aceptado ? 'aceptado' : 'pendiente').includes(terminoLower) ||
            presupuesto.fecha.includes(termino)
          );

          // Buscar en información de la reparación asociada
          let enReparacion = false;
          if (presupuesto.reparacion) {
            const reparacion = presupuesto.reparacion;
            enReparacion = (
              (reparacion.descripcion && reparacion.descripcion.toLowerCase().includes(terminoLower)) ||
              (reparacion.estado && reparacion.estado.toLowerCase().includes(terminoLower)) ||
              (reparacion.equipo_nombre && reparacion.equipo_nombre.toLowerCase().includes(terminoLower)) ||
              (reparacion.cliente_nombre && reparacion.cliente_nombre.toLowerCase().includes(terminoLower)) ||
              (reparacion.tecnico_nombre && reparacion.tecnico_nombre.toLowerCase().includes(terminoLower)) ||
              reparacion.id.toString().includes(termino)
            );
          }

          return enPropiedadesPresupuesto || enReparacion;
        });

        return this.formatearPresupuestosParaBusqueda(presupuestosFiltrados);
      }),
      catchError(() => of([]))
    );
  }

  // ====== DATA FORMATTING ======
  private formatearPresupuestosParaBusqueda(presupuestos: any[]): Presupuesto[] {
    return presupuestos.map(presupuesto => ({
      ...presupuesto,
      displayText: this.formatearDisplayText(presupuesto),
      reparacion_descripcion: presupuesto.reparacion?.descripcion || `Reparación #${presupuesto.reparacion_id}`,
      estado_legible: presupuesto.aceptado ? 'aceptado' : 'pendiente',
      monto_total: presupuesto.monto_total,
      fecha: presupuesto.fecha
    }));
  }

  private formatearDisplayText(presupuesto: Presupuesto): string {
    const monto = presupuesto.monto_total ? 
      `$${presupuesto.monto_total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
      'Sin monto';
    
    const estado = presupuesto.aceptado ? 'Aceptado' : 'Pendiente';
    const fecha = presupuesto.fecha ? new Date(presupuesto.fecha).toLocaleDateString('es-AR') : 'Sin fecha';
    const reparacionDesc = presupuesto.reparacion?.descripcion ? 
      presupuesto.reparacion.descripcion.substring(0, 50) + (presupuesto.reparacion.descripcion.length > 50 ? '...' : '') : 
      `Reparación #${presupuesto.reparacion_id}`;
    
    return `Presupuesto #${presupuesto.id} | ${monto} | ${estado} | ${fecha} | ${reparacionDesc}`;
  }

  // ====== RELATED DATA OPERATIONS ======
  cargarInformacionReparacion(presupuestoId: number): Observable<any> {
    return this.show(presupuestoId).pipe(
      map(presupuesto => presupuesto.reparacion),
      catchError(() => of(null))
    );
  }

  cargarReparacionesParaPresupuestos(presupuestos: Presupuesto[]): Observable<Map<number, any>> {
    return of(new Map());
  }

  listOptimizado(page = 1, perPage = 10, search: string = ''): Observable<Paginated<Presupuesto>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<Paginated<Presupuesto>>(`${this.base}/listado-optimizado`, { 
      params, 
      headers: this.getHeaders() 
    });
  }

  // NUEVO MÉTODO: Obtener presupuesto aprobado para una reparación
  obtenerPresupuestoAprobado(reparacionId: number): Observable<Presupuesto | null> {
    return this.buscarPorReparacion(reparacionId).pipe(
      map(presupuestos => {
        // Buscar el primer presupuesto aprobado
        const presupuestoAprobado = presupuestos.find(p => p.aceptado === true);
        
        if (presupuestoAprobado) {
          return presupuestoAprobado;
        }
        
        // Si no hay aprobado, buscar el más reciente
        const presupuestoReciente = presupuestos.sort((a, b) => {
          const dateA = new Date(a.fecha);
          const dateB = new Date(b.fecha);
          return dateB.getTime() - dateA.getTime();
        })[0];
        
        return presupuestoReciente || null;
      }),
      catchError(() => of(null))
    );
  }

  // NUEVO MÉTODO: Verificar si una reparación tiene presupuesto aprobado
  tienePresupuestoAprobado(reparacionId: number): Observable<boolean> {
    return this.buscarPorReparacion(reparacionId).pipe(
      map(presupuestos => {
        return presupuestos.some(p => p.aceptado === true);
      }),
      catchError(() => of(false))
    );
  }
}