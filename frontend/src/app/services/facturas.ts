import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


/* [
  {
    "id": 1,
    "presupuesto_id": 3,
    "numero": "F0001-00002345",
    "letra": "A",
    "fecha": "2025-10-11T14:30:00Z",
    "monto_total": 15200.5,
    "detalle": "Reparación general de equipos informáticos",
    "created_at": "2025-11-03T15:15:41.959Z",
    "updated_at": "2025-11-03T15:15:41.959Z"
  }
] */


export interface Factura {
  id: number;
  presupuesto_id: number;
  numero: string;
  letra: string;
  fecha: string; // ISO (YYYY-MM-DDTHH:mm:ssZ)
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
