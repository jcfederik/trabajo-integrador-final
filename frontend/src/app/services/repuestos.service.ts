import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Repuesto {
  id: number;
  nombre: string;
  stock: number;
  costo_base: number;
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

  // ====== SEARCH OPERATIONS ======
  buscarRepuestos(termino: string): Observable<Repuesto[]> {
    return this.http.get<Repuesto[]>(`${this.apiUrl}?search=${termino}`);
  }
}