import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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

export interface CobroDetalle {
    id: number;
    medio_cobro_id: number;
    monto_pagado: number;
    fecha: string;
    medioCobro: MedioCobro;
}

export interface Cobro {
    id: number;
    factura_id: number;
    monto: number;
    fecha: string;
    detalles: CobroDetalle[];
}

export interface NewCobro {
    factura_id: number;
    monto_pagado: number;
    medio_cobro_id: number;
    fecha?: string;
}

@Injectable({
    providedIn: 'root'
})
export class CobroService {
    private http = inject(HttpClient);
    private apiUrl = 'http://127.0.0.1:8000/api';
    private cobrosUrl = `${this.apiUrl}/cobros`;
    private mediosCobroUrl = `${this.apiUrl}/medios-cobro`;

    constructor() { }

    getListaCobros(page: number = 1, perPage: number = 15): Observable<PaginatedResponse<Cobro>> {
        const params = { page: page.toString(), per_page: perPage.toString() };
        return this.http.get<PaginatedResponse<Cobro>>(this.cobrosUrl, { params });
    }

    registrarCobro(cobroData: NewCobro): Observable<any> {
        return this.http.post<any>(this.cobrosUrl, cobroData);
    }

    getMediosCobro(): Observable<MedioCobro[]> {
        return this.http.get<PaginatedResponse<MedioCobro>>(this.mediosCobroUrl + '?per_page=999').pipe(
            map(response => response.data)
        );
    }
}