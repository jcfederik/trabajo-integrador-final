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

  /**
   * Obtener proveedores con paginación + búsqueda opcional
   */
  getProveedores(
    page: number = 1,
    perPage: number = 15,
    search: string = ''
  ): Observable<PaginatedResponse<Proveedor>> {

    let params = new HttpParams()
      .set('page', String(page))
      .set('per_page', String(perPage));

    if (search.trim() !== '') {
      params = params.set('search', search.trim());
    }

    return this.http.get<PaginatedResponse<Proveedor>>(this.apiUrl, { params });
  }

  /**
   * Obtener proveedor por ID
   */
  getProveedor(id: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear proveedor
   */
  createProveedor(data: Partial<Proveedor>): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.apiUrl, data);
  }

  /**
   * Actualizar proveedor
   */
  updateProveedor(id: number, data: Partial<Proveedor>): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Eliminar proveedor
   */
  deleteProveedor(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /**
   * Buscar proveedores sin paginar (ideal para modales, selects, autocomplete)
   */
  buscarProveedores(termino: string): Observable<Proveedor[]> {
    const params = new HttpParams().set('search', termino.trim());
    return this.http.get<Proveedor[]>(this.apiUrl, { params });
  }

  /**
   * Obtener todos los proveedores (sin paginación)
   * Útil para modales de compra de repuestos
   */
  getAll(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${this.apiUrl}/all`);
  }
}
