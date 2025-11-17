import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  // ✅ CORREGIDO: Quitar el include que causa el error 500
  list(page = 1, perPage = 10): Observable<Paginated<Presupuesto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());
      // ❌ QUITADO: &include=reparacion

    return this.http.get<Paginated<Presupuesto>>(this.base, { params });
  }

  show(id: number): Observable<Presupuesto> {
    return this.http.get<Presupuesto>(`${this.base}/${id}`);
  }

  create(payload: Partial<Presupuesto>) {
    return this.http.post(this.base, payload);
  }

  update(id: number, payload: Partial<Presupuesto>) {
    return this.http.put(`${this.base}/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete(`${this.base}/${id}`);
  }

  // ✅ CORREGIDO: Simplificar búsqueda global
  buscarGlobal(termino: string): Observable<Presupuesto[]> {
    if (!termino.trim()) {
      return of([]);
    }

    const params = new HttpParams()
      .set('q', termino)
      .set('per_page', '100');
      // ❌ QUITADO: include=reparacion

    return this.http.get<any>(`${this.base}/buscar`, { params }).pipe(
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
        console.error('Error en búsqueda global de presupuestos:', error);
        return this.buscarPresupuestosFallback(termino);
      })
    );
  }

  buscarPresupuestos(termino: string): Observable<Presupuesto[]> {
    if (!termino.trim()) {
      return of([]);
    }

    const params = new HttpParams()
      .set('q', termino)
      .set('per_page', '100');

    return this.http.get<any>(`${this.base}/buscar`, { params }).pipe(
      map(response => {
        const presupuestos = Array.isArray(response) ? response : [];
        return this.formatearPresupuestosParaBusqueda(presupuestos);
      }),
      catchError(() => {
        return this.buscarPresupuestosFallback(termino);
      })
    );
  }

  private buscarPresupuestosFallback(termino: string): Observable<Presupuesto[]> {
    // Cargar todos los presupuestos sin include
    return this.http.get<Paginated<Presupuesto>>(`${this.base}?per_page=100`).pipe(
      map(response => {
        const todosLosPresupuestos = response.data || [];
        const terminoLower = termino.toLowerCase();
        
        const presupuestosFiltrados = todosLosPresupuestos.filter((presupuesto: Presupuesto) => {
          return (
            presupuesto.id.toString().includes(termino) ||
            (presupuesto.monto_total && presupuesto.monto_total.toString().includes(termino)) ||
            (presupuesto.aceptado ? 'aceptado' : 'pendiente').includes(terminoLower) ||
            presupuesto.fecha.includes(termino)
          );
        });

        return this.formatearPresupuestosParaBusqueda(presupuestosFiltrados);
      }),
      catchError(() => {
        return of([]);
      })
    );
  }

  // ✅ NUEVO: Método para formatear presupuestos para búsqueda
  private formatearPresupuestosParaBusqueda(presupuestos: any[]): Presupuesto[] {
    return presupuestos.map(presupuesto => ({
      ...presupuesto,
      displayText: this.formatearDisplayText(presupuesto),
      reparacion_descripcion: presupuesto.reparacion?.descripcion || `Reparación #${presupuesto.reparacion_id}`,
      estado_legible: presupuesto.aceptado ? 'aceptado' : 'pendiente',
      // Campos para búsqueda global
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

  // ✅ NUEVO: Método para cargar información de reparación por separado
  cargarInformacionReparacion(presupuestoId: number): Observable<any> {
    return this.show(presupuestoId).pipe(
      map(presupuesto => presupuesto.reparacion),
      catchError(() => of(null))
    );
  }

  // ✅ NUEVO: Método para cargar múltiples reparaciones
  cargarReparacionesParaPresupuestos(presupuestos: Presupuesto[]): Observable<Map<number, any>> {
    const reparacionesIds = [...new Set(presupuestos.map(p => p.reparacion_id))];
    
    if (reparacionesIds.length === 0) {
      return of(new Map());
    }
    return of(new Map());
  }
}