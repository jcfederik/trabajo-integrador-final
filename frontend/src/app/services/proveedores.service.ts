import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Proveedor {
  id?: number;
  razon_social: string;
  cuit: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
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

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {
  private apiUrl = 'http://localhost:8000/api/proveedores';

  constructor(private http: HttpClient) {}

  // Método actualizado para aceptar 3 parámetros (page, perPage, search)
  getProveedores(page: number = 1, perPage: number = 15, search: string = ''): Observable<PaginatedResponse<Proveedor>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    // Agregar parámetro de búsqueda si existe
    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }

    return this.http.get<PaginatedResponse<Proveedor>>(this.apiUrl, { params });
  }

  getProveedor(id: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.apiUrl}/${id}`);
  }

  createProveedor(proveedor: Partial<Proveedor>): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.apiUrl, proveedor);
  }

  updateProveedor(id: number, proveedor: Partial<Proveedor>): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.apiUrl}/${id}`, proveedor);
  }

  deleteProveedor(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  buscarProveedores(termino: string): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${this.apiUrl}?search=${termino}`);
  }
}