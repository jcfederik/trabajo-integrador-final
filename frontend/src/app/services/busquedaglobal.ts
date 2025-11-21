// src/app/services/search.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

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

export interface SearchableItem {
  id: number;
  // Campos comunes para Cliente
  nombre?: string;
  email?: string;
  telefono?: string;
  
  // Campos para Equipo
  descripcion?: string;
  marca?: string;
  modelo?: string;
  nro_serie?: string;
  
  // Campos para Reparación
  estado?: string;
  tecnico_nombre?: string;
  equipo_nombre?: string;
  reparacion_nombre?: string;
  fecha?: string;
  // Campos para Factura
  numero?: string;
  letra?: string;
  monto_total?: number | null;
  detalle?: string;
  
  // Campos para Presupuesto
  aceptado?: boolean;
  
  // Campos para Proveedor
  razon_social?: string;
  cuit?: string;
  direccion?: string;
  
  // Campos para Repuesto
  stock?: number;
  costo_base?: number;
  
  // Campos para CompraRepuesto
  numero_comprobante?: string;
  total?: number;
}

export interface ServerSearchParams {
  component: string;
  term: string;
  page?: number;
  perPage?: number;
}

// 🔥 NUEVA INTERFAZ para respuesta de búsqueda global
export interface GlobalSearchResult {
  component: string;
  data: any[];
  total: number;
  current_page: number;
  last_page: number;
}

// 🔥 NUEVA INTERFAZ para búsqueda global unificada
export interface GlobalSearchResponse {
  success: boolean;
  results: GlobalSearchResult[];
  total_results: number;
}

// 🔥 Nueva interfaz para búsqueda de componentes del dashboard
export interface DashboardComponent {
  title: string;
  icon: string;
  description: string;
  route?: string;
  disabled?: boolean;
  type: string; // Tipo para búsqueda
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private apiBaseUrl = 'http://127.0.0.1:8000/api';

  private currentComponent = new BehaviorSubject<string>('');
  private searchTerm = new BehaviorSubject<string>('');
  private searchData = new BehaviorSubject<any[]>([]);
  private dashboardSearchTerm = new BehaviorSubject<string>('');
  private globalSearchTerm = new BehaviorSubject<string>('');
  
  currentComponent$ = this.currentComponent.asObservable();
  searchTerm$ = this.searchTerm.asObservable();
  searchData$ = this.searchData.asObservable();
  dashboardSearchTerm$ = this.dashboardSearchTerm.asObservable();
  globalSearchTerm$ = this.globalSearchTerm.asObservable();

  constructor(private http: HttpClient){}

  setCurrentComponent(component: string) {
    this.currentComponent.next(component);
  }

  setSearchTerm(term: string) {
    this.searchTerm.next(term);
  }

  setSearchData(data: any[]) {
    this.searchData.next(data);
  }

  setGlobalSearchTerm(term: string) {
    this.globalSearchTerm.next(term);
  }

  setDashboardSearchTerm(term: string) {
    this.dashboardSearchTerm.next(term);
  }

  clearSearch() {
    this.searchTerm.next('');
  }

  clearDashboardSearch() {
    this.dashboardSearchTerm.next('');
  }

  clearGlobalSearch() {
    this.globalSearchTerm.next('');
  }

  searchDashboardComponents(components: DashboardComponent[], searchTerm: string): DashboardComponent[] {
    if (!searchTerm) return components;
    
    const normalizedTerm = searchTerm.toLowerCase().trim();
    
    return components.filter(component => 
      component.title.toLowerCase().includes(normalizedTerm) ||
      component.description.toLowerCase().includes(normalizedTerm) ||
      (component.type && component.type.toLowerCase().includes(normalizedTerm))
    );
  }

  // 🔥 MÉTODO MEJORADO - Búsqueda universal por componente
  search<T extends SearchableItem>(items: T[], term: string, componentType: string): T[] {
    if (!term) return items;
    
    const normalizedTerm = term.trim().toLowerCase();
    
    if (!normalizedTerm) return items;
    
    // Dividir el término de búsqueda en palabras individuales
    const searchWords = normalizedTerm.split(/\s+/).filter(word => word.length > 0);
    
    // Si no hay palabras después de dividir, retornar todos los items
    if (searchWords.length === 0) return items;
    
    return items.filter(item => {
      // Obtener campos específicos según el tipo de componente
      const searchableFields = this.getSearchableFields(item, componentType);
      
      // Crear un string con todos los campos buscables
      const searchableText = searchableFields
        .filter(Boolean) // Remover valores null/undefined
        .join(' ') // Unir con espacios
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remover acentos
      
      // Verificar que TODAS las palabras estén presentes en el texto buscable
      return searchWords.every(word => {
        const cleanWord = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return searchableText.includes(cleanWord);
      });
    });
  }

  // 🔍 Método para determinar qué campos buscar según el componente
  private getSearchableFields(item: SearchableItem, componentType: string): string[] {
    const fields: string[] = [];

    switch (componentType) {
      case 'clientes':
        fields.push(
          item.nombre || '',
          item.email || '',
          item.telefono || ''
        );
      break;

      case 'equipos':
        fields.push(
          item.descripcion || '',
          item.marca || '',
          item.modelo || '',
          item.nro_serie || ''
        );
      break;

      case 'reparaciones':
        fields.push(
          item.descripcion || '',
          item.estado || '',
          item.fecha || '',
          item.equipo_nombre || '',
          item.tecnico_nombre || '',
          item.reparacion_nombre || ''
        );
      break;

      case 'facturas':
        fields.push(
          item.numero || '',
          item.letra || '',
          item.detalle || '',
          item.monto_total?.toString() || '',
          item.fecha || '',
          (item as any).presupuesto_id?.toString() || ''
        );
      break;

      case 'presupuestos':
        fields.push(
          item.monto_total?.toString() || '',
          item.aceptado ? 'aceptado' : 'pendiente',
          item.fecha || '',
          (item as any).reparacion_descripcion || '',
          (item as any).descripcion || ''
        );
      break;

      case 'proveedores':
        fields.push(
          item.razon_social || '',
          item.cuit || '',
          item.direccion || '',
          item.telefono || '',
          item.email || ''
        );
        break;

      case 'repuestos':
        fields.push(
          item.nombre || '',
          item.stock?.toString() || '',
          item.costo_base?.toString() || ''
        );
        break;

      default:
        fields.push(
          item.nombre || '',
          item.email || '',
          item.telefono || '',
          item.descripcion || '',
          item.numero || '',
          item.detalle || ''
        );
    }

    return fields;
  }

  searchByField<T extends SearchableItem>(
    items: T[], 
    term: string, 
    field: keyof SearchableItem
  ): T[] {
    if (!term) return items;
    
    const normalizedTerm = term.trim().toLowerCase();
    
    return items.filter(item => {
      const fieldValue = item[field];
      if (fieldValue === undefined || fieldValue === null) return false;
      
      return fieldValue.toString().toLowerCase().includes(normalizedTerm);
    });
  }

  advancedSearch<T extends SearchableItem>(
    items: T[], 
    searchCriteria: Partial<SearchableItem>
  ): T[] {
    return items.filter(item => {
      return Object.entries(searchCriteria).every(([key, value]) => {
        if (value === undefined || value === null || value === '') return true;
        
        const itemValue = item[key as keyof SearchableItem];
        if (itemValue === undefined || itemValue === null) return false;
        
        return itemValue.toString().toLowerCase().includes(value.toString().toLowerCase());
      });
    });
  }
  
  searchOnServer(component: string, term: string, page: number = 1, perPage: number = 10): Observable<any> {
    if (!term.trim()) {
      const url = `${this.apiBaseUrl}/${component}?page=${page}&per_page=${perPage}`;
      return this.http.get<any>(url);
    }


    const url = `${this.apiBaseUrl}/${component}?search=${encodeURIComponent(term)}&page=${page}&per_page=${perPage}`;
    
    console.log(`🔍 Búsqueda en servidor [${component}]:`, term, 'URL:', url);
    
    return this.http.get<any>(url);
  }

  // MÉTODOS ESPECÍFICOS PARA CADA COMPONENTE
  searchFacturas(term: string, page: number = 1, perPage: number = 10): Observable<any> {
    return this.searchOnServer('facturas', term, page, perPage);
  }

  searchProveedores(term: string, page: number = 1, perPage: number = 10): Observable<any> {
    return this.searchOnServer('proveedor', term, page, perPage);
  }
  
  searchRepuestos(term: string, page: number = 1, perPage: number = 10): Observable<any> {
    return this.searchOnServer('repuestos', term, page, perPage);
  }


  searchClientes(term: string, page: number = 1, perPage: number = 10): Observable<any> {
    return this.searchOnServer('clientes', term, page, perPage);
  }

  searchEquipos(term: string, page: number = 1, perPage: number = 10): Observable<any> {
    return this.searchOnServer('equipos', term, page, perPage);
  }

  searchReparaciones(term: string, page: number = 1, perPage: number = 10): Observable<any> {
    return this.searchOnServer('reparaciones', term, page, perPage);
  }

  searchPresupuestos(term: string, page: number = 1, perPage: number = 10): Observable<any> {
    return this.searchOnServer('presupuestos', term, page, perPage);
  }

  globalSearch(term: string, components: string[] = ['clientes', 'equipos', 'reparaciones', 'facturas', 'presupuestos', 'proveedores', 'repuestos']): Observable<GlobalSearchResponse> {
    if (!term.trim()) {
      return new Observable(observer => {
        observer.next({ success: true, results: [], total_results: 0 });
        observer.complete();
      });
    }

    const url = `${this.apiBaseUrl}/global-search`;
    const body = {
      term: term,
      components: components
    };

    return this.http.post<GlobalSearchResponse>(url, body);
  }

  // 🔥 MÉTODO PARA OBTENER SUGERENCIAS RÁPIDAS
  getQuickSuggestions(term: string, component: string, limit: number = 5): Observable<any> {
    const url = `${this.apiBaseUrl}/${component}?search=${encodeURIComponent(term)}&per_page=${limit}&page=1`;
    return this.http.get<any>(url);
  }

  // 🔥 MÉTODO ORIGINAL (se mantiene por compatibilidad)
  searchFacturasOnServer(term: string, page = 1, perPage = 10): Observable<Paginated<Factura>> {
    return this.http.get<Paginated<Factura>>(
      `${this.apiBaseUrl}/facturas/search?q=${encodeURIComponent(term)}&page=${page}&per_page=${perPage}`
    );
  }
}