import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface Reparacion {
  id: number;
  equipo_id: number;
  usuario_id: number;
  descripcion: string;
  fecha: string; 
  estado: string;
  equipo?: any;
  tecnico?: any;
  repuestos?: any[];
  equipo_nombre?: string;
  tecnico_nombre?: string;
  reparacion_nombre?: string;
  displayText?: string;
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
export class ReparacionService {
  private base = 'http://127.0.0.1:8000/api/reparaciones';

  constructor(private http: HttpClient) {}

  list(page = 1, perPage = 10): Observable<Paginated<Reparacion>> {
    return this.http.get<Paginated<Reparacion>>(
      `${this.base}?page=${page}&per_page=${perPage}&include=equipo,tecnico`
    );
  }

  show(id: number): Observable<Reparacion> {
    return this.http.get<Reparacion>(`${this.base}/${id}`);
  }

  create(payload: Partial<Reparacion>): Observable<Reparacion> {
    return this.http.post<Reparacion>(`${this.base}`, payload);
  }

  update(id: number, payload: Partial<Reparacion>): Observable<Reparacion> {
    return this.http.put<Reparacion>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  buscarReparaciones(termino: string): Observable<Reparacion[]> {
    if (!termino.trim()) {
      return of([]);
    }

    const params = new HttpParams()
      .set('q', termino)
      .set('per_page', '100')
      .set('include', 'equipo,tecnico');

    return this.http.get<Paginated<Reparacion>>(`${this.base}/buscar`, { params }).pipe(
      map(response => {
        const reparaciones = response.data || response;
        
        return reparaciones.map(reparacion => ({
          ...reparacion,
          displayText: this.formatearDisplayText(reparacion)
        }));
      }),
      catchError(() => {
        return this.buscarReparacionesFallback(termino);
      })
    );
  }

  private buscarReparacionesFallback(termino: string): Observable<Reparacion[]> {
    return this.http.get<Paginated<Reparacion>>(
      `${this.base}?per_page=100&include=equipo,tecnico`
    ).pipe(
      map(response => {
        const todasLasReparaciones = response.data || response;
        const terminoLower = termino.toLowerCase();
        
        const reparacionesFiltradas = todasLasReparaciones.filter((reparacion: Reparacion) => 
          reparacion.descripcion?.toLowerCase().includes(terminoLower) ||
          reparacion.estado?.toLowerCase().includes(terminoLower) ||
          (reparacion.equipo?.descripcion && reparacion.equipo.descripcion.toLowerCase().includes(terminoLower)) ||
          (reparacion.tecnico?.nombre && reparacion.tecnico.nombre.toLowerCase().includes(terminoLower))
        );

        return reparacionesFiltradas.map(reparacion => ({
          ...reparacion,
          displayText: this.formatearDisplayText(reparacion)
        }));
      })
    );
  }

  private formatearDisplayText(reparacion: Reparacion): string {
    const equipoDesc = reparacion.equipo?.descripcion || 'Equipo no especificado';
    const tecnicoNombre = reparacion.tecnico?.nombre || 'Técnico no asignado';
    const fecha = reparacion.fecha ? new Date(reparacion.fecha).toLocaleDateString() : 'Sin fecha';
    
    return `#${reparacion.id} - ${reparacion.descripcion} | ${equipoDesc} | ${tecnicoNombre} | ${fecha}`;
  }

  buscarClientes(termino: string): Observable<any[]> {
    return this.http.get<any>('http://127.0.0.1:8000/api/clientes?per_page=100').pipe(
      map(response => {
        const todosLosClientes = response.data || response;
        const terminoLower = termino.toLowerCase();
        
        return todosLosClientes.filter((cliente: any) => 
          cliente.nombre?.toLowerCase().includes(terminoLower) ||
          cliente.email?.toLowerCase().includes(terminoLower) ||
          (cliente.telefono && cliente.telefono.includes(termino))
        );
      })
    );
  }

  buscarEquipos(termino: string): Observable<any[]> {
    return this.http.get<any>('http://127.0.0.1:8000/api/equipos?per_page=100').pipe(
      map(response => {
        const todosLosEquipos = response.data || response;
        const terminoLower = termino.toLowerCase();
        
        return todosLosEquipos.filter((equipo: any) => 
          equipo.descripcion?.toLowerCase().includes(terminoLower) ||
          equipo.marca?.toLowerCase().includes(terminoLower) ||
          equipo.modelo?.toLowerCase().includes(terminoLower) ||
          (equipo.nro_serie && equipo.nro_serie.includes(termino))
        );
      })
    );
  }

  buscarEquiposPorCliente(clienteId: number): Observable<any[]> {
    return this.http.get<any>('http://127.0.0.1:8000/api/equipos?per_page=100').pipe(
      map(response => {
        const todosLosEquipos = response.data || response;
        return todosLosEquipos.filter((equipo: any) => 
          equipo.cliente_id === clienteId
        );
      })
    );
  }

  buscarTecnicos(termino: string): Observable<any[]> {
    return this.http.get<any[]>(`http://127.0.0.1:8000/api/tecnicos/buscar?q=${encodeURIComponent(termino)}`).pipe(
      catchError(() => {
        return this.http.get<any>('http://127.0.0.1:8000/api/usuarios?per_page=100').pipe(
          map(response => {
            const todosLosUsuarios = response.data || response;
            const terminoLower = termino.toLowerCase();
            
            return todosLosUsuarios.filter((usuario: any) => 
              usuario.tipo === 'tecnico' && 
              (usuario.nombre?.toLowerCase().includes(terminoLower) ||
               usuario.tipo?.toLowerCase().includes(terminoLower))
            );
          })
        );
      })
    );
  }
}