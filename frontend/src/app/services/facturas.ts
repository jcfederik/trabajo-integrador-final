import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AlertService } from './alert.service';

// ====== INTERFACES ======
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
  detalles: any[];
}

@Injectable({ providedIn: 'root' })
export class FacturaService {
  private base = 'http://127.0.0.1:8000/api/facturas';

  constructor(
    private http: HttpClient,
    private alertService: AlertService
  ) {}
  
  // ====== MÉTODO AUXILIAR PARA HEADERS ======
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });
  }

  // ====== OPERACIONES CRUD ======
  list(page = 1, perPage = 10): Observable<Paginated<Factura>> {
    return this.http.get<Paginated<Factura>>(`${this.base}?page=${page}&per_page=${perPage}`).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudieron cargar las facturas');
        throw error;
      })
    );
  }

  show(id: number): Observable<Factura> {
    return this.http.get<Factura>(`${this.base}/${id}`).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudo cargar la factura');
        throw error;
      })
    );
  }

  create(payload: Partial<Factura>) {
    return this.http.post(`${this.base}`, payload).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudo crear la factura');
        throw error;
      })
    );
  }

  update(id: number, payload: Partial<Factura>) {
    return this.http.put(`${this.base}/${id}`, payload).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudo actualizar la factura');
        throw error;
      })
    );
  }

  delete(id: number) {
    return this.http.delete(`${this.base}/${id}`).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudo eliminar la factura');
        throw error;
      })
    );
  }

  // ====== UTILIDADES PARA COBROS ======
  getSaldoPendiente(id: number): Observable<SaldoInfo> {
    return this.http.get<SaldoInfo>(`${this.base}/${id}/saldo`).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudo obtener el saldo pendiente');
        throw error;
      })
    );
  }
  
  getCobrosPorFactura(id: number): Observable<Cobro[]> {
    return this.http.get<Cobro[]>(`${this.base}/${id}/cobros`).pipe(
      catchError(error => {
        this.alertService.showError('Error', 'No se pudieron cargar los cobros de la factura');
        throw error;
      })
    );
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