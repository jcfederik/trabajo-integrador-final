import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SearchResult } from '../components/search-selector/search-selector.component';
import { Factura } from './facturas';
import { AlertService } from './alert.service';

// ====== INTERFACES ======
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

  constructor(
    private http: HttpClient,
    private alertService: AlertService
  ) {}

  // ====== OPERACIONES CRUD ======
  getClientes(page: number = 1, perPage: number = 15): Observable<PaginatedResponse<Cliente>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<PaginatedResponse<Cliente>>(this.apiUrl, { params }).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudieron cargar los clientes');
        throw error;
      })
    );
  }

  getCliente(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudo cargar el cliente');
        throw error;
      })
    );
  }

  createCliente(cliente: Partial<Cliente>): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, cliente).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudo crear el cliente');
        throw error;
      })
    );
  }

  updateCliente(id: number, cliente: Partial<Cliente>): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/${id}`, cliente).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudo actualizar el cliente');
        throw error;
      })
    );
  }

  deleteCliente(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudo eliminar el cliente');
        throw error;
      })
    );
  }

  // ====== GESTIÓN DE FACTURAS ======
  getFacturasPorCliente(clienteId: number, page: number = 1, perPage: number = 15): Observable<PaginatedResponse<Factura>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<PaginatedResponse<Factura>>(`${this.apiUrl}/${clienteId}/facturas`, { params }).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudieron cargar las facturas del cliente');
        throw error;
      })
    );
  }

  getTodasFacturasPorCliente(clienteId: number): Observable<Factura[]> {
    return this.http.get<Factura[]>(`${this.apiUrl}/${clienteId}/facturas/todas`).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudieron cargar todas las facturas');
        throw error;
      })
    );
  }

  // ====== OPERACIONES DE BÚSQUEDA ======
  buscarClientes(termino: string): Observable<Cliente[]> {
    const params = new HttpParams().set('q', termino);
    return this.http.get<Cliente[]>(`${this.apiUrl}/buscar`, { params }).pipe(
      catchError(error => {
        return of([]);
      })
    );
  }

  buscarClientesParaSelector(termino: string): Observable<SearchResult[]> {
    const terminoLimpio = termino.trim();
    
    if (!terminoLimpio) {
      return this.getClientes(1, 5).pipe(
        map(response => response.data.map(cliente => this.mapClienteToSearchResult(cliente))),
        catchError(() => of([]))
      );
    }

    return this.buscarClientes(terminoLimpio).pipe(
      map(clientes => clientes.map(cliente => this.mapClienteToSearchResult(cliente))),
      catchError(() => {
        return this.getClientes(1, 50).pipe(
          map(response => {
            const clientes = response.data;
            const t = terminoLimpio.toLowerCase();
            const filtrados = clientes.filter(cliente =>
              cliente.nombre?.toLowerCase().includes(t) ||
              cliente.email?.toLowerCase().includes(t) ||
              cliente.telefono?.toLowerCase().includes(t)
            );
            return filtrados.map(cliente => this.mapClienteToSearchResult(cliente));
          }),
          catchError(() => of([]))
        );
      })
    );
  }

  private mapClienteToSearchResult(cliente: Cliente): SearchResult {
    return {
      id: cliente.id,
      nombre: cliente.nombre,
      email: cliente.email,
      telefono: cliente.telefono
    };
  }
}