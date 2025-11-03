import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Presupuesto {
  id: number;
  reparacion_id: number;
  fecha: string;         // ISO o 'yyyy-MM-ddTHH:mm:ssZ'
  monto_total: number|null;
  aceptado: boolean;
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
export class PresupuestoService {
  private base = 'http://127.0.0.1:8000/api/presupuestos';

  constructor(private http: HttpClient) {}

  list(page = 1, perPage = 10): Observable<Paginated<Presupuesto>> {
    return this.http.get<Paginated<Presupuesto>>(`${this.base}?page=${page}&per_page=${perPage}`);
  }

  show(id: number): Observable<Presupuesto> {
    return this.http.get<Presupuesto>(`${this.base}/${id}`);
  }

  create(payload: Partial<Presupuesto>) {
    return this.http.post(this.base, payload);
  }

  update(id: number, payload: Partial<Presupuesto>) {
    return this.http.put(`${this.base}/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete(`${this.base}/${id}`);
  }
}
