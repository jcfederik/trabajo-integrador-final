import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SearchResult } from '../components/search-selector/search-selector.component';
import { AlertService } from './alert.service';

// ====== INTERFACES ======
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

  constructor(
    private http: HttpClient,
    private alertService: AlertService
  ) {}

  // ====== OPERACIONES DE BÚSQUEDA ======
  buscarUsuarios(termino: string): Observable<Usuario[]> {
    const params = new HttpParams().set('q', termino);
    return this.http.get<Usuario[]>(`${this.apiUrl}/buscar`, { params }).pipe(
      catchError(() => of([]))
    );
  }

  buscarTecnicos(termino: string): Observable<SearchResult[]> {
    if (!termino.trim()) {
      return this.getTecnicos(1, 10).pipe(
        map(response => response.data.map(usuario => this.mapUsuarioToSearchResult(usuario))),
        catchError(() => of([]))
      );
    }

    return this.buscarUsuarios(termino).pipe(
      map(usuarios => {
        const tecnicos = usuarios.filter(usuario => 
          usuario.tipo?.toLowerCase() === 'tecnico'
        );
        return tecnicos.map(usuario => this.mapUsuarioToSearchResult(usuario));
      }),
      catchError(() => {
        return this.getUsuariosPaginados(1, 50).pipe(
          map(response => {
            const usuarios = response.data;
            const t = termino.toLowerCase();
            
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

  // ====== OBTENCIÓN DE TÉCNICOS ======
  getTecnicos(page: number = 1, perPage: number = 10): Observable<PaginatedResponse<Usuario>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<PaginatedResponse<Usuario>>(this.apiUrl, { params }).pipe(
      map(response => {
        const tecnicos = {
          ...response,
          data: response.data.filter(usuario => usuario.tipo?.toLowerCase() === 'tecnico')
        };
        return tecnicos;
      }),
      catchError(() => {
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

  // ====== OBTENCIÓN DE USUARIOS ======
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudieron cargar los usuarios');
        throw error;
      })
    );
  }

  getUsuariosPaginados(page: number = 1, perPage: number = 15): Observable<PaginatedResponse<Usuario>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<PaginatedResponse<Usuario>>(this.apiUrl, { params }).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudieron cargar los usuarios');
        throw error;
      })
    );
  }

  // ====== CARGA INICIAL ======
  cargarUsuariosIniciales(limit: number = 5): Observable<SearchResult[]> {
    const params = new HttpParams()
      .set('per_page', limit.toString())
      .set('page', '1');

    return this.http.get<PaginatedResponse<Usuario>>(this.apiUrl, { params }).pipe(
      map(response => {
        const usuarios = response.data;
        const tecnicos = usuarios.filter(usuario => usuario.tipo?.toLowerCase() === 'tecnico');
        return tecnicos.map(usuario => this.mapUsuarioToSearchResult(usuario));
      }),
      catchError(() => of([]))
    );
  }

  // ====== MAPEO DE DATOS ======
  private mapUsuarioToSearchResult(usuario: Usuario): SearchResult {
    return {
      id: usuario.id,
      nombre: usuario.nombre || usuario.name,
      email: usuario.email,
      tipo: usuario.tipo
    };
  }
}