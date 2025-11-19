import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SearchResult } from '../components/search-selector/search-selector.component';

export interface Usuario {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  tipo?: string;
  nombre?: string;
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

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private apiUrl = 'http://127.0.0.1:8000/api/usuarios'; 

  constructor(private http: HttpClient) {}

  // Buscar usuarios/técnicos por nombre
  buscarUsuarios(termino: string): Observable<Usuario[]> {
    const params = new HttpParams().set('q', termino);
    return this.http.get<Usuario[]>(`${this.apiUrl}/buscar`, { params });
  }

  // 🔹 Buscar específicamente técnicos
  buscarTecnicos(termino: string): Observable<SearchResult[]> {
  if (!termino.trim()) {
    // Si no hay término, cargar primeros técnicos
    return this.getTecnicos(1, 10).pipe(
      map(response => response.data.map(usuario => this.mapUsuarioToSearchResult(usuario))),
      catchError(() => of([]))
    );
  }

  // Usar el endpoint que SÍ existe
  return this.buscarUsuarios(termino).pipe(
    map(usuarios => {
      // Filtrar solo técnicos del resultado
      const tecnicos = usuarios.filter(usuario => 
        usuario.tipo?.toLowerCase() === 'tecnico'
      );
      return tecnicos.map(usuario => this.mapUsuarioToSearchResult(usuario));
    }),
    catchError(error => {
      console.warn('Error en búsqueda específica de técnicos:', error);
      // Fallback: usar listado general y filtrar
      return this.getUsuariosPaginados(1, 50).pipe(
        map(response => {
          const usuarios = response.data;
          const t = termino.toLowerCase();
          
          // Filtrar por término y tipo técnico
          const filtrados = usuarios.filter(usuario =>
            usuario.tipo?.toLowerCase() === 'tecnico' &&
            (usuario.nombre?.toLowerCase().includes(t) ||
             usuario.email?.toLowerCase().includes(t) ||
             usuario.tipo?.toLowerCase().includes(t))
          );
          
          return filtrados.map(usuario => this.mapUsuarioToSearchResult(usuario));
        })
      );
    })
  );
}

  // 🔹 Obtener técnicos paginados
  getTecnicos(page: number = 1, perPage: number = 10): Observable<PaginatedResponse<Usuario>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<PaginatedResponse<Usuario>>(this.apiUrl, { params }).pipe(
      map(response => {
        // Filtrar solo técnicos del listado general
        const tecnicos = {
          ...response,
          data: response.data.filter(usuario => usuario.tipo?.toLowerCase() === 'tecnico')
        };
        return tecnicos;
      }),
      catchError(error => {
        console.error('Error cargando técnicos:', error);
        // Devolver estructura vacía en caso de error
        return of({
          data: [],
          current_page: 1,
          last_page: 1,
          per_page: perPage,
          total: 0,
          from: 0,
          to: 0
        });
      })
    );
  }

  // Obtener todos los usuarios (para cuando no hay término)
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  // 🔹 Obtener usuarios paginados
  getUsuariosPaginados(page: number = 1, perPage: number = 15): Observable<PaginatedResponse<Usuario>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<PaginatedResponse<Usuario>>(this.apiUrl, { params });
  }

  // 🔹 Cargar usuarios iniciales (para precarga)
  cargarUsuariosIniciales(limit: number = 5): Observable<SearchResult[]> {
    const params = new HttpParams()
      .set('per_page', limit.toString())
      .set('page', '1');

    return this.http.get<PaginatedResponse<Usuario>>(this.apiUrl, { params }).pipe(
      map(response => {
        const usuarios = response.data;
        // Filtrar solo técnicos para la precarga
        const tecnicos = usuarios.filter(usuario => usuario.tipo?.toLowerCase() === 'tecnico');
        return tecnicos.map(usuario => this.mapUsuarioToSearchResult(usuario));
      }),
      catchError(() => of([]))
    );
  }

  // 🔹 Mapear Usuario a SearchResult
  private mapUsuarioToSearchResult(usuario: Usuario): SearchResult {
    return {
      id: usuario.id,
      nombre: usuario.nombre || usuario.name, // Usar nombre o name como fallback
      email: usuario.email,
      tipo: usuario.tipo
    };
  }
}