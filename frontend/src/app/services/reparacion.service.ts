import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Reparacion {
  id: number;
  equipo_id: number;
  usuario_id: number;
  descripcion: string;
  fecha: string;    // ISO (YYYY-MM-DD)
  estado: string;
  // poblados por with():
  equipo?: any;
  tecnico?: any;
  repuestos?: any[];
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
export class ReparacionService {
  private base = 'http://127.0.0.1:8000/api/reparaciones';

  constructor(private http: HttpClient) {}

  list(page = 1, perPage = 10): Observable<Paginated<Reparacion>> {
    return this.http.get<Paginated<Reparacion>>(`${this.base}?page=${page}&per_page=${perPage}`);
  }

  show(id: number): Observable<Reparacion> {
    return this.http.get<Reparacion>(`${this.base}/${id}`);
  }

  create(payload: Partial<Reparacion>) {
    return this.http.post(`${this.base}`, payload);
  }

  update(id: number, payload: Partial<Reparacion>) {
    return this.http.put(`${this.base}/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete(`${this.base}/${id}`);
  }
}
