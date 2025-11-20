// cliente.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SearchResult } from '../components/search-selector/search-selector.component';
import { Factura } from './facturas';

export interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private apiUrl = 'http://127.0.0.1:8000/api/clientes';

  constructor(private http: HttpClient) {}

  // ====== CRUD OPERATIONS ======
  getClientes(page: number = 1, perPage: number = 15): Observable<PaginatedResponse<Cliente>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<PaginatedResponse<Cliente>>(this.apiUrl, { params });
  }

  getCliente(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`);
  }

  createCliente(cliente: Partial<Cliente>): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, cliente);
  }

  updateCliente(id: number, cliente: Partial<Cliente>): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/${id}`, cliente);
  }

  deleteCliente(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // ====== FACTURAS MANAGEMENT ======
  getFacturasPorCliente(clienteId: number, page: number = 1, perPage: number = 15): Observable<PaginatedResponse<Factura>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<PaginatedResponse<Factura>>(`${this.apiUrl}/${clienteId}/facturas`, { params });
  }

  getTodasFacturasPorCliente(clienteId: number): Observable<Factura[]> {
    return this.http.get<Factura[]>(`${this.apiUrl}/${clienteId}/facturas/todas`);
  }

  // ====== SEARCH OPERATIONS ======
  buscarClientes(termino: string): Observable<Cliente[]> {
    const params = new HttpParams().set('q', termino);
    return this.http.get<Cliente[]>(`${this.apiUrl}/buscar`, { params });
  }

  // 🔹 NUEVO MÉTODO: Para el search-selector (devuelve SearchResult[])
buscarClientesParaSelector(termino: string): Observable<SearchResult[]> {
  if (!termino.trim()) {
    // Si no hay término, cargar primeros clientes
    return this.getClientes(1, 5).pipe(
      map(response => response.data.map(cliente => this.mapClienteToSearchResult(cliente))),
      catchError(() => of([]))
    );
  }

  // Usar el endpoint de búsqueda que SÍ existe
  return this.buscarClientes(termino).pipe(
    map(clientes => clientes.map(cliente => this.mapClienteToSearchResult(cliente))),
    catchError(error => {
      console.warn('Error en búsqueda específica de clientes:', error);
      // Fallback: usar listado normal con filtro
      return this.getClientes(1, 10).pipe(
        map(response => {
          const clientes = response.data;
          const t = termino.toLowerCase();
          const filtrados = clientes.filter(cliente =>
            cliente.nombre?.toLowerCase().includes(t) ||
            cliente.email?.toLowerCase().includes(t) ||
            cliente.telefono?.toLowerCase().includes(t)
          );
          return filtrados.map(cliente => this.mapClienteToSearchResult(cliente));
        })
      );
    })
  );
}

  // 🔹 Mapear Cliente a SearchResult
  private mapClienteToSearchResult(cliente: Cliente): SearchResult {
    return {
      id: cliente.id,
      nombre: cliente.nombre,
      email: cliente.email,
      telefono: cliente.telefono
    };
  }
}