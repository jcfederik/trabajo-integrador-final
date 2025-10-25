// src/app/services/cliente.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
}

// 🔥 Interfaz para la respuesta paginada
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

  // 🔹 Obtener clientes paginados
  getClientes(page: number = 1, perPage: number = 15): Observable<PaginatedResponse<Cliente>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<PaginatedResponse<Cliente>>(this.apiUrl, { params });
  }

  // 🔹 Obtener cliente por ID
  getCliente(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`);
  }

  // 🔹 Crear cliente
  createCliente(cliente: Partial<Cliente>): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, cliente);
  }

  // 🔹 Actualizar cliente
  updateCliente(id: number, cliente: Partial<Cliente>): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/${id}`, cliente);
  }

  // 🔹 Eliminar cliente
  deleteCliente(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}