import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  getFacturasPorCliente(clienteId: number, page: number = 1, perPage: number = 15): Observable<PaginatedResponse<Factura>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<PaginatedResponse<Factura>>(`${this.apiUrl}/${clienteId}/facturas`, { params });
  }

  getTodasFacturasPorCliente(clienteId: number): Observable<Factura[]> {
    return this.http.get<Factura[]>(`${this.apiUrl}/${clienteId}/facturas/todas`);
  }

  buscarClientes(termino: string): Observable<Cliente[]> {
    const params = new HttpParams().set('q', termino);
    return this.http.get<Cliente[]>(`${this.apiUrl}/buscar`, { params });
  } 
}