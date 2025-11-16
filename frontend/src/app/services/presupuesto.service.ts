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
  reparacion?: any;
  displayText?: string;
  reparacion_descripcion?: string;
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

  list(page = 1, perPage = 10): Observable<Paginated<Presupuesto>> {
    return this.http.get<Paginated<Presupuesto>>(
      `${this.base}?page=${page}&per_page=${perPage}&include=reparacion`
    );
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

  // 🔥 NUEVO MÉTODO PARA BÚSQUEDA GLOBAL - USA EL ENDPOINT /buscar DEL BACKEND
  buscarGlobal(termino: string): Observable<Presupuesto[]> {
    if (!termino.trim()) {
      return of([]);
    }

    const params = new HttpParams()
      .set('q', termino)
      .set('per_page', '100')
      .set('include', 'reparacion');

    return this.http.get<any>(`${this.base}/buscar`, { params }).pipe(
      map(response => {
        // Manejar diferentes formatos de respuesta
        let presupuestos: any[] = [];
        
        if (Array.isArray(response)) {
          presupuestos = response;
        } else if (response.data && Array.isArray(response.data)) {
          presupuestos = response.data;
        } else if (response.presupuestos && Array.isArray(response.presupuestos)) {
          presupuestos = response.presupuestos;
        }
        
        return presupuestos.map(presupuesto => ({
          ...presupuesto,
          displayText: this.formatearDisplayText(presupuesto),
          reparacion_descripcion: presupuesto.reparacion?.descripcion || 'Reparación no especificada',
          estado_legible: presupuesto.aceptado ? 'aceptado' : 'pendiente'
        }));
      }),
      catchError((error) => {
        console.error('Error en búsqueda global de presupuestos:', error);
        // Si falla la búsqueda específica, intentar con búsqueda fallback
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
      .set('per_page', '100')
      .set('include', 'reparacion');

    return this.http.get<any>(`${this.base}/buscar`, { params }).pipe(
      map(response => {
        const presupuestos = Array.isArray(response) ? response : [];
        
        return presupuestos.map(presupuesto => ({
          ...presupuesto,
          displayText: this.formatearDisplayText(presupuesto),
          reparacion_descripcion: presupuesto.reparacion?.descripcion || 'Reparación no especificada'
        }));
      }),
      catchError(() => {
        return this.buscarPresupuestosFallback(termino);
      })
    );
  }

  private buscarPresupuestosFallback(termino: string): Observable<Presupuesto[]> {
    return this.http.get<Paginated<Presupuesto>>(
      `${this.base}?per_page=100&include=reparacion`
    ).pipe(
      map(response => {
        const todosLosPresupuestos = response.data || [];
        const terminoLower = termino.toLowerCase();
        
        const presupuestosFiltrados = todosLosPresupuestos.filter((presupuesto: Presupuesto) => {
          return (
            presupuesto.id.toString().includes(termino) ||
            (presupuesto.monto_total && presupuesto.monto_total.toString().includes(termino)) ||
            (presupuesto.aceptado ? 'aceptado' : 'pendiente').includes(terminoLower) ||
            (presupuesto.reparacion?.descripcion && presupuesto.reparacion.descripcion.toLowerCase().includes(terminoLower)) ||
            (presupuesto.reparacion?.estado && presupuesto.reparacion.estado.toLowerCase().includes(terminoLower))
          );
        });

        return presupuestosFiltrados.map(presupuesto => ({
          ...presupuesto,
          displayText: this.formatearDisplayText(presupuesto),
          reparacion_descripcion: presupuesto.reparacion?.descripcion || 'Reparación no especificada'
        }));
      }),
      catchError(() => {
        return of([]);
      })
    );
  }

  private formatearDisplayText(presupuesto: Presupuesto): string {
    const monto = presupuesto.monto_total ? 
      `$${presupuesto.monto_total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
      'Sin monto';
    
    const estado = presupuesto.aceptado ? 'Aceptado' : 'Pendiente';
    const fecha = presupuesto.fecha ? new Date(presupuesto.fecha).toLocaleDateString() : 'Sin fecha';
    const reparacionDesc = presupuesto.reparacion?.descripcion ? 
      presupuesto.reparacion.descripcion.substring(0, 50) + (presupuesto.reparacion.descripcion.length > 50 ? '...' : '') : 
      'Reparación no especificada';
    
    return `Presupuesto #${presupuesto.id} | ${monto} | ${estado} | ${fecha} | ${reparacionDesc}`;
  }
}