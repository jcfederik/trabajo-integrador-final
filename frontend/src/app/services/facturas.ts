import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface Factura {
  id: number;
  presupuesto_id: number;
  numero: string;
  letra: string;
  fecha: string;
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

export interface SaldoInfo {
  monto_total: number;
  saldo_pendiente: number;
}

export interface Cobro {
  id: number;
  factura_id: number;
  monto: number;
  fecha: string;
  detalles: any[]; // Usa la interfaz CobroDetalle real si la importas.
}

@Injectable({ providedIn: 'root' })
export class FacturaService {
  private base = 'http://127.0.0.1:8000/api/facturas';

  constructor(private http: HttpClient) {}
  
  // ====== MÉTODO AUXILIAR PARA OBTENER HEADERS ======
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });
  }

  // ====== CRUD OPERATIONS ======
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

  // ====== MÉTODOS DE UTILIDAD PARA COBROS (NUEVOS) ======
  
  /**
   * Obtiene el monto total y el saldo pendiente de una factura.
   * Llama a: GET /api/facturas/{id}/saldo
   */
  getSaldoPendiente(id: number): Observable<SaldoInfo> {
    return this.http.get<SaldoInfo>(`${this.base}/${id}/saldo`);
  }
  
  /**
   * Obtiene el historial de cobros (pagos) de una factura específica.
   * Llama a: GET /api/facturas/{id}/cobros
   */
  getCobrosPorFactura(id: number): Observable<Cobro[]> {
    return this.http.get<Cobro[]>(`${this.base}/${id}/cobros`);
  }
  
  verificarPresupuestosFacturados(presupuestosIds: number[]): Observable<any[]> {
    const params = new HttpParams()
      .set('presupuestos_ids', presupuestosIds.join(','));

    return this.http.get<any[]>(`${this.base}/verificar-facturados`, {
      params,
      headers: this.getHeaders()
    }).pipe(
      catchError(() => of([]))
    );
  }
}
