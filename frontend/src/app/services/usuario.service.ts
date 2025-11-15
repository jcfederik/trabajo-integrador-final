import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Usuario {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private apiUrl = 'http://127.0.0.1:8000/api/usuarios'; 

  constructor(private http: HttpClient) {}

  // Buscar usuarios/técnicos por nombre
  buscarUsuarios(termino: string): Observable<Usuario[]> {
    const params = new HttpParams().set('q', termino);
    return this.http.get<Usuario[]>(`${this.apiUrl}/buscar`, { params });
  }

  // Obtener todos los usuarios (para cuando no hay término)
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }
}