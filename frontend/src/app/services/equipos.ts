// src/app/services/equipo.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Equipo {
  id: number;
  descripcion: string;
  marca?: string;
  modelo?: string;
  nro_serie?: string;
}

// 🔥 Interfaz para la respuesta paginada
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

@Injectable({ providedIn: 'root' })
export class EquipoService {
  private apiUrl = 'http://127.0.0.1:8000/api/equipos';

  constructor(private http: HttpClient) {}

  // 🔹 Obtener equipos paginados
  getEquipos(page: number = 1, perPage: number = 15): Observable<PaginatedResponse<Equipo>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<PaginatedResponse<Equipo>>(this.apiUrl, { params });
  }

  // 🔹 Obtener equipo por ID
  getEquipo(id: number): Observable<Equipo> {
    return this.http.get<Equipo>(`${this.apiUrl}/${id}`);
  }

  // 🔹 Crear equipo
  createEquipo(equipo: Partial<Equipo>): Observable<Equipo> {
    return this.http.post<Equipo>(this.apiUrl, equipo);
  }

  // 🔹 Actualizar equipo
  updateEquipo(id: number, equipo: Partial<Equipo>): Observable<Equipo> {
    return this.http.put<Equipo>(`${this.apiUrl}/${id}`, equipo);
  }

  // 🔹 Eliminar equipo
  deleteEquipo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}