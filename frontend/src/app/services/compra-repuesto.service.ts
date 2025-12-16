import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AlertService } from './alert.service';

// ====== INTERFACES ======
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

// ====== SERVICIO ======
@Injectable({ providedIn: 'root' })
export class CompraRepuestoService {
  private apiUrl = 'http://localhost:8000/api/compra-repuestos';

  constructor(
    private http: HttpClient,
    private alertService: AlertService
  ) {}

  // ====== LISTAR COMPRAS CON PAGINACIÓN ======
  getCompras(page: number = 1, perPage: number = 15, search: string = ''): Observable<PaginatedResponse<CompraRepuesto>> {
    
    let params = new HttpParams()
      .set('page', page)
      .set('per_page', perPage);

    if (search.trim() !== '') {
      params = params.set('search', search.trim());
    }

    return this.http.get<PaginatedResponse<CompraRepuesto>>(this.apiUrl, { params }).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudieron cargar las compras');
        throw error;
      })
    );
  }

  // ====== OBTENER UNA COMPRA POR ID ======
  getCompra(id: number): Observable<CompraRepuesto> {
    return this.http.get<CompraRepuesto>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudo cargar la compra');
        throw error;
      })
    );
  }

  // ====== REGISTRAR UNA COMPRA ======
  crearCompra(data: Partial<CompraRepuesto>): Observable<any> {
    return this.http.post<any>(this.apiUrl, data).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudo crear la compra');
        throw error;
      })
    );
  }

  // ====== ACTUALIZAR UNA COMPRA ======
  updateCompra(id: number, data: Partial<CompraRepuesto>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudo actualizar la compra');
        throw error;
      })
    );
  }

  // ====== ELIMINAR UNA COMPRA ======
  deleteCompra(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudo eliminar la compra');
        throw error;
      })
    );
  }
}