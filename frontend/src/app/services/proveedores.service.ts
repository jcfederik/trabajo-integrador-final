import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface Proveedor {
  id?: number;
  razon_social: string;
  nombre_fantasia?: string;
  cuit: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
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

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {
  private apiUrl = 'http://localhost:8000/api/proveedores';

  constructor(private http: HttpClient) {}

  // ====== CRUD OPERATIONS ======
  getProveedores(page: number = 1, perPage: number = 15, search: string = ''): Observable<PaginatedResponse<Proveedor>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }

    return this.http.get<PaginatedResponse<Proveedor>>(this.apiUrl, { params }).pipe(
      map(response => this.formatearRespuestaProveedores(response))
    );
  }

  getProveedor(id: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.apiUrl}/${id}`).pipe(
      map(proveedor => this.formatearProveedorParaDisplay(proveedor))
    );
  }

  createProveedor(proveedor: Partial<Proveedor>): Observable<Proveedor> {
    const headers = this.getAuthHeaders();
    return this.http.post<Proveedor>(this.apiUrl, proveedor, { headers }).pipe(
      map(response => this.formatearProveedorParaDisplay(response))
    );
  }

  updateProveedor(id: number, proveedor: Partial<Proveedor>): Observable<Proveedor> {
    const headers = this.getAuthHeaders();
    return this.http.put<Proveedor>(`${this.apiUrl}/${id}`, proveedor, { headers }).pipe(
      map(response => this.formatearProveedorParaDisplay(response))
    );
  }

  deleteProveedor(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }

  // ====== SEARCH OPERATIONS ======
  buscarProveedores(termino: string): Observable<Proveedor[]> {
    if (!termino || termino.trim() === '') {
      return of([]);
    }

    const params = new HttpParams()
      .set('search', termino.trim())
      .set('per_page', '10');

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => {
        let proveedores: any[] = [];
        
        if (Array.isArray(response)) {
          proveedores = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          proveedores = response.data;
        } else if (response && Array.isArray(response.items)) {
          proveedores = response.items;
        }
        
        return proveedores.map(proveedor => this.formatearProveedorParaBusqueda(proveedor));
      }),
      catchError(error => {
        console.error('Error buscando proveedores:', error);
        return of([]);
      })
    );
  }

  buscarProveedoresRapido(termino: string, limit: number = 5): Observable<Proveedor[]> {
    if (!termino || termino.trim() === '') {
      return of([]);
    }

    const params = new HttpParams()
      .set('search', termino.trim())
      .set('per_page', limit.toString())
      .set('page', '1');

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => {
        const proveedores = this.extraerDatosDeRespuesta(response);
        return proveedores.map(proveedor => this.formatearProveedorParaBusqueda(proveedor));
      }),
      catchError(() => of([]))
    );
  }

  buscarProveedoresGlobal(termino: string): Observable<Proveedor[]> {
    return this.buscarProveedoresRapido(termino, 100);
  }

  // ====== HELPER METHODS ======
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  private extraerDatosDeRespuesta(response: any): any[] {
    if (!response) return [];
    
    if (Array.isArray(response)) {
      return response;
    } else if (response.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response.items && Array.isArray(response.items)) {
      return response.items;
    } else if (response.proveedores && Array.isArray(response.proveedores)) {
      return response.proveedores;
    }
    
    return [];
  }

  private formatearRespuestaProveedores(response: any): PaginatedResponse<Proveedor> {
    const proveedores = this.extraerDatosDeRespuesta(response);
    const formateados = proveedores.map(proveedor => this.formatearProveedorParaDisplay(proveedor));
    
    return {
      data: formateados,
      current_page: response.current_page || response.page || 1,
      last_page: response.last_page || response.total_pages || 1,
      per_page: response.per_page || response.limit || 15,
      total: response.total || response.count || proveedores.length,
      from: response.from || 1,
      to: response.to || proveedores.length
    };
  }

  private formatearProveedorParaDisplay(proveedor: any): Proveedor {
    if (!proveedor) return {} as Proveedor;
    
    return {
      id: proveedor.id,
      razon_social: proveedor.razon_social || '',
      nombre_fantasia: proveedor.nombre_fantasia || proveedor.nombre_comercial || '',
      cuit: proveedor.cuit || '',
      direccion: proveedor.direccion || '',
      telefono: proveedor.telefono || '',
      email: proveedor.email || '',
      created_at: proveedor.created_at,
      updated_at: proveedor.updated_at,
      nombre: proveedor.razon_social || proveedor.nombre_fantasia || ''
    };
  }

  private formatearProveedorParaBusqueda(proveedor: any): Proveedor {
    const proveedorFormateado = this.formatearProveedorParaDisplay(proveedor);
    
    if (!proveedorFormateado.nombre) {
      proveedorFormateado.nombre = proveedorFormateado.razon_social || proveedorFormateado.nombre_fantasia || '';
    }
    
    return proveedorFormateado;
  }

  // ====== UTILITY METHODS ======
  
  validarCUIT(cuit: string): boolean {
    if (!cuit) return false;
    const cuitRegex = /^\d{2}-\d{8}-\d{1}$/;
    return cuitRegex.test(cuit);
  }

  formatearCUIT(cuit: string): string {
    if (!cuit) return '';
    const numeros = cuit.replace(/\D/g, '');
    
    if (numeros.length !== 11) return cuit;
    
    return `${numeros.slice(0, 2)}-${numeros.slice(2, 10)}-${numeros.slice(10)}`;
  }

  getNombreMostrar(proveedor: Proveedor): string {
    if (!proveedor) return '';
    return proveedor.nombre_fantasia || proveedor.razon_social || '';
  }

  getInfoResumida(proveedor: Proveedor): string {
    if (!proveedor) return '';
    
    const partes = [];
    if (proveedor.cuit) partes.push(`CUIT: ${proveedor.cuit}`);
    if (proveedor.telefono) partes.push(`Tel: ${proveedor.telefono}`);
    if (proveedor.email) partes.push(`Email: ${proveedor.email}`);
    
    return partes.join(' | ');
  }

  // ====== CACHE / LOCAL STORAGE ======
  
  guardarCacheProveedores(proveedores: Proveedor[]): void {
    try {
      localStorage.setItem('cache_proveedores', JSON.stringify(proveedores));
      localStorage.setItem('cache_proveedores_timestamp', Date.now().toString());
    } catch (error) {
      console.warn('No se pudo guardar cache de proveedores:', error);
    }
  }

  obtenerCacheProveedores(): Proveedor[] | null {
    try {
      const cache = localStorage.getItem('cache_proveedores');
      const timestamp = localStorage.getItem('cache_proveedores_timestamp');
      
      if (!cache || !timestamp) return null;
      
      const ahora = Date.now();
      const tiempoCache = Number(timestamp);
      
      if (ahora - tiempoCache > 3600000) {
        localStorage.removeItem('cache_proveedores');
        localStorage.removeItem('cache_proveedores_timestamp');
        return null;
      }
      
      return JSON.parse(cache);
    } catch (error) {
      return null;
    }
  }

  buscarEnCache(termino: string): Proveedor[] {
    const cache = this.obtenerCacheProveedores();
    if (!cache) return [];
    
    const terminoLower = termino.toLowerCase().trim();
    
    return cache.filter(proveedor => {
      const nombre = this.getNombreMostrar(proveedor).toLowerCase();
      const cuit = (proveedor.cuit || '').toLowerCase();
      const email = (proveedor.email || '').toLowerCase();
      const telefono = (proveedor.telefono || '').toLowerCase();
      
      return nombre.includes(terminoLower) ||
             cuit.includes(terminoLower) ||
             email.includes(terminoLower) ||
             telefono.includes(terminoLower);
    });
  }
}