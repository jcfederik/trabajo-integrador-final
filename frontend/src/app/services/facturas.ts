import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Factura {
  id: number;
  presupuesto_id: number;
  numero: string;
  letra: string;
  fecha: string;
  monto_total: number;
  detalle: string;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  next_page_url: string | null;
  prev_page_url: string | null;
  per_page: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class FacturaService {
  private base = 'http://127.0.0.1:8000/api/facturas';

  constructor(private http: HttpClient) {}

  // ====== CRUD OPERATIONS ======
  list(page = 1, perPage = 10): Observable<Paginated<Factura>> {
    return this.http.get<Paginated<Factura>>(`${this.base}?page=${page}&per_page=${perPage}`);
  }

  show(id: number): Observable<Factura> {
    return this.http.get<Factura>(`${this.base}/${id}`);
  }

  create(payload: Partial<Factura>) {
    return this.http.post(`${this.base}`, payload);
  }

  update(id: number, payload: Partial<Factura>) {
    return this.http.put(`${this.base}/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete(`${this.base}/${id}`);
  }
}