import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SearchableItem } from './busquedaglobal';
import { AlertService } from './alert.service';

// ====== INTERFACES ======
export interface HistorialStock extends SearchableItem {
  id: number;
  repuesto_id: number;
  tipo_mov: string;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  descripcion?: string;
  referencia_id?: number;
  referencia_type?: string;
  created_at: string;
  updated_at: string;
  repuesto?: {
    id: number;
    nombre: string;
    codigo: string;
    precio_venta: number;
    stock_actual?: number;
  };
  displayText?: string;
  repuesto_nombre?: string;
  repuesto_codigo?: string;
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

export interface HistorialStockFilters {
  repuesto_id?: number;
  tipo_mov?: string;
  desde?: string;
  hasta?: string;
  q?: string;
}

@Injectable({ providedIn: 'root' })
export class HistorialStockService {
  private base = 'http://127.0.0.1:8000/api/historial-stock';

  constructor(
    private http: HttpClient,
    private alertService: AlertService
  ) {}

  // ====== OPERACIONES CRUD ======
  list(page = 1, perPage = 20, filters?: HistorialStockFilters): Observable<Paginated<HistorialStock>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (filters) {
      if (filters.repuesto_id) {
        params = params.set('repuesto_id', filters.repuesto_id.toString());
      }
      if (filters.tipo_mov) {
        params = params.set('tipo_mov', filters.tipo_mov);
      }
      if (filters.desde) {
        params = params.set('desde', filters.desde);
      }
      if (filters.hasta) {
        params = params.set('hasta', filters.hasta);
      }
      if (filters.q) {
        params = params.set('search', filters.q);
      }
    }

    return this.http.get<any>(this.base, { params }).pipe(
      map(response => this.formatearRespuestaPaginated(response)),
      catchError(error => {
        this.alertService.showError('Error', 'No se pudo cargar el historial de stock');
        throw error;
      })
    );
  }

  show(id: number): Observable<HistorialStock> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(
      map(item => this.formatearItemParaDisplay(item)),
      catchError(error => {
        this.alertService.showError('Error', 'No se pudo cargar el registro de historial');
        throw error;
      })
    );
  }

  // ====== OPERACIONES DE BÚSQUEDA ======
  buscarGlobal(termino: string): Observable<HistorialStock[]> {
    if (!termino.trim()) return of([]);

    const params = new HttpParams()
      .set('q', termino)
      .set('per_page', '100');

    return this.http.get<any>(`${this.base}/buscar`, { params }).pipe(
      map(response => {
        const historial = this.extraerDatosDeRespuesta(response);
        return this.formatearHistorialParaBusqueda(historial);
      }),
      catchError(() => this.buscarHistorialFallback(termino))
    );
  }

  buscarHistorial(termino: string): Observable<HistorialStock[]> {
    if (!termino.trim()) return of([]);

    const params = new HttpParams()
      .set('q', termino)
      .set('per_page', '50');

    return this.http.get<any>(`${this.base}/buscar`, { params }).pipe(
      map(response => {
        const historial = this.extraerDatosDeRespuesta(response);
        return this.formatearHistorialParaBusqueda(historial);
      }),
      catchError(() => this.buscarHistorialFallback(termino))
    );
  }

  private buscarHistorialFallback(termino: string): Observable<HistorialStock[]> {
    const params = new HttpParams()
      .set('per_page', '100');

    return this.http.get<any>(this.base, { params }).pipe(
      map(response => {
        const todosLosItems = this.extraerDatosDeRespuesta(response);
        const terminoLower = termino.toLowerCase();
        
        const itemsFiltrados = todosLosItems.filter((item: HistorialStock) => {
          const repuestoNombre = item.repuesto?.nombre?.toLowerCase() || '';
          const repuestoCodigo = item.repuesto?.codigo?.toLowerCase() || '';
          
          return (
            item.id.toString().includes(termino) ||
            item.tipo_mov.toLowerCase().includes(terminoLower) ||
            item.cantidad.toString().includes(termino) ||
            repuestoNombre.includes(terminoLower) ||
            repuestoCodigo.includes(terminoLower) ||
            (item.descripcion && item.descripcion.toLowerCase().includes(terminoLower)) ||
            item.created_at.includes(termino)
          );
        });

        return this.formatearHistorialParaBusqueda(itemsFiltrados);
      }),
      catchError(() => of([]))
    );
  }

  // ====== MÉTODOS AUXILIARES ======
  private extraerDatosDeRespuesta(response: any): any[] {
    if (!response) return [];
    
    if (Array.isArray(response)) {
      return response;
    } else if (response.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response.items && Array.isArray(response.items)) {
      return response.items;
    } else if (response.results && Array.isArray(response.results)) {
      return response.results;
    } else if (response.historial && Array.isArray(response.historial)) {
      return response.historial;
    }
    
    return [];
  }

  private formatearRespuestaPaginated(response: any): Paginated<HistorialStock> {
    const items = this.extraerDatosDeRespuesta(response);
    const formateados = this.formatearHistorialParaDisplay(items);
    
    return {
      data: formateados,
      current_page: response.current_page || response.page || 1,
      last_page: response.last_page || response.total_pages || 1,
      next_page_url: response.next_page_url || response.next || null,
      prev_page_url: response.prev_page_url || response.previous || null,
      per_page: response.per_page || response.limit || 20,
      total: response.total || response.count || items.length
    };
  }

  // ====== OPCIONES DE FILTRO ======
  getTiposMovimiento(): Observable<string[]> {
    return of([
      'COMPRA',
      'ASIGNACION_REPUESTO',
      'AJUSTE',
      'DEVOLUCION',
      'VENTA',
      'BAJA'
    ]);
  }

  // ====== FORMATEO DE DATOS ======
  private formatearHistorialParaDisplay(items: any[]): HistorialStock[] {
    if (!items || !Array.isArray(items)) {
      return [];
    }
    
    return items.map(item => this.formatearItemParaDisplay(item));
  }

  private formatearHistorialParaBusqueda(items: any[]): HistorialStock[] {
    if (!items || !Array.isArray(items)) {
      return [];
    }
    
    return items.map(item => ({
      ...item,
      displayText: this.formatearDisplayText(item),
      repuesto_nombre: item.repuesto?.nombre || `Repuesto #${item.repuesto_id}`,
      repuesto_codigo: item.repuesto?.codigo || ''
    }));
  }

  private formatearItemParaDisplay(item: any): HistorialStock {
    if (!item) {
      return {} as HistorialStock;
    }
    
    return {
      ...item,
      displayText: this.formatearDisplayText(item),
      repuesto_nombre: item.repuesto?.nombre || `Repuesto #${item.repuesto_id}`,
      repuesto_codigo: item.repuesto?.codigo || ''
    };
  }

  private formatearDisplayText(item: any): string {
    if (!item) return 'Sin información';
    
    const fecha = item.created_at ? 
      new Date(item.created_at).toLocaleDateString('es-AR') : 
      'Sin fecha';
    
    const repuestoNombre = item.repuesto?.nombre ? 
      item.repuesto.nombre.substring(0, 40) + (item.repuesto.nombre.length > 40 ? '...' : '') : 
      `Repuesto #${item.repuesto_id}`;
    
    const cantidad = item.cantidad >= 0 ? `+${item.cantidad}` : item.cantidad;
    const stock = `Stock: ${item.stock_anterior || 0} → ${item.stock_nuevo || 0}`;
    
    return `#${item.id || '?'} | ${fecha} | ${repuestoNombre} | ${item.tipo_mov || 'SIN_TIPO'} ${cantidad || 0} | ${stock}`;
  }

  // ====== MÉTODOS DE UTILIDAD ======
  getTipoMovimientoColor(tipo: string): string {
    const colores: { [key: string]: string } = {
      'COMPRA': 'success',
      'VENTA': 'primary',
      'ASIGNACION_REPUESTO': 'info',
      'AJUSTE': 'warning',
      'DEVOLUCION': 'secondary',
      'BAJA': 'danger'
    };
    return colores[tipo] || 'secondary';
  }

  getTipoMovimientoIcono(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'COMPRA': 'bi-cart-plus',
      'VENTA': 'bi-cart-dash',
      'ASIGNACION_REPUESTO': 'bi-tools',
      'AJUSTE': 'bi-arrow-left-right',
      'DEVOLUCION': 'bi-arrow-counterclockwise',
      'BAJA': 'bi-trash'
    };
    return iconos[tipo] || 'bi-circle';
  }
}