import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MedioCobro {
  id: number;
  nombre: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class MedioCobroService {
  private apiUrl = 'http://127.0.0.1:8000/api/medios-cobro';

  constructor(private http: HttpClient) {}

  getMedios(page = 1, per_page = 10): Observable<PaginatedResponse<MedioCobro>> {
    return this.http.get<PaginatedResponse<MedioCobro>>(`${this.apiUrl}?page=${page}&per_page=${per_page}`);
  }

  createMedio(medio: Partial<MedioCobro>): Observable<MedioCobro> {
    return this.http.post<MedioCobro>(this.apiUrl, medio);
  }

  updateMedio(id: number, medio: Partial<MedioCobro>): Observable<MedioCobro> {
    return this.http.put<MedioCobro>(`${this.apiUrl}/${id}`, medio);
  }

  deleteMedio(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
