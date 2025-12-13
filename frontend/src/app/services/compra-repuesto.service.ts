import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// -------------------------------------------------------
// INTERFACES
// -------------------------------------------------------

export interface CompraRepuesto {
  id?: number;
  proveedor_id: number;
  repuesto_id: number;
  cantidad: number;
  total?: number;
  numero_comprobante: string;
  estado?: string;
  created_at?: string;
  updated_at?: string;
  proveedor?: any;
  repuesto?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// -------------------------------------------------------
// SERVICIO
// -------------------------------------------------------

@Injectable({
  providedIn: 'root'
})
export class CompraRepuestoService {

  private apiUrl = 'http://localhost:8000/api/compra-repuestos';

  constructor(private http: HttpClient) {}

  // -------------------------------------------------------
  // LISTAR COMPRAS CON PAGINACIÓN + SEARCH
  // -------------------------------------------------------
  getCompras(page: number = 1, perPage: number = 15, search: string = ''): Observable<PaginatedResponse<CompraRepuesto>> {
    
    let params = new HttpParams()
      .set('page', page)
      .set('per_page', perPage);

    if (search.trim() !== '') {
      params = params.set('search', search.trim());
    }

    return this.http.get<PaginatedResponse<CompraRepuesto>>(this.apiUrl, { params });
  }

  // -------------------------------------------------------
  // OBTENER UNA COMPRA POR ID
  // -------------------------------------------------------
  getCompra(id: number): Observable<CompraRepuesto> {
    return this.http.get<CompraRepuesto>(`${this.apiUrl}/${id}`);
  }

  // -------------------------------------------------------
  // REGISTRAR UNA COMPRA DE REPUESTO
  // -------------------------------------------------------
  crearCompra(data: Partial<CompraRepuesto>): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  // -------------------------------------------------------
  // ACTUALIZAR UNA COMPRA (CASOS RAROS: cambiar estado, etc.)
  // -------------------------------------------------------
  updateCompra(id: number, data: Partial<CompraRepuesto>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  // -------------------------------------------------------
  // ELIMINAR UNA COMPRA
  // -------------------------------------------------------
  deleteCompra(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
