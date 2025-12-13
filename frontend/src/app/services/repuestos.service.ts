import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';


export interface Repuesto {
  id: number;
  nombre: string;
  stock: number;
  costo_base: number;
  created_at?: string;
  updated_at?: string;
}

export interface CompraRepuesto {
  nombre: string;
  cantidad: number;
  costo_base: number;
  descripcion?: string;
  proveedor?: string;
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
export class RepuestoService {
  private apiUrl = 'http://localhost:8000/api/repuestos';

  constructor(private http: HttpClient) {}

  // ====== CRUD OPERATIONS ======
  getRepuestos(page: number = 1, perPage: number = 15, search: string = ''): Observable<PaginatedResponse<Repuesto>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }

    return this.http.get<PaginatedResponse<Repuesto>>(this.apiUrl, { params });
  }

  createRepuesto(repuesto: Partial<Repuesto>): Observable<any> {
    return this.http.post(this.apiUrl, repuesto);
  }

  updateRepuesto(id: number, repuesto: Partial<Repuesto>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, repuesto);
  }

  deleteRepuesto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  comprarRepuesto(compra: CompraRepuesto): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/comprar`, compra, { headers }).pipe(
      catchError(error => {
        console.error('Error al comprar repuesto:', error);
        throw error;
      })
    );
  }

  // ====== HELPER ======
  private getAuthHeaders() {
    const token = localStorage.getItem('token'); // o donde guardes tu token
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  // ====== SEARCH OPERATIONS ======
  buscarRepuestos(termino: string): Observable<any> {
    if (!termino || termino.trim() === '') {
      return of([]);
    }
    
    const params = new HttpParams()
      .set('q', termino.trim())
      .set('per_page', '100');
    
    const headers = this.getAuthHeaders();
    
    return this.http.get<any>(`${this.apiUrl}/buscar`, { 
      params, 
      headers
    }).pipe(
      map(response => {
        console.log('Respuesta completa del backend:', response);
        return response;
      }),
      catchError(error => {
        console.error('Error buscando repuestos:', error);
        return of({
          data: [],
          current_page: 1,
          last_page: 1,
          total: 0
        });
      })
    );
  }
}