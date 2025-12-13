import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SearchResult {
  id: number;
  nombre?: string;
  name?: string;
  descripcion?: string;
  email?: string;
  telefono?: string;
  tipo?: string;
  marca?: string;
  modelo?: string;
  nro_serie?: string;
  cliente_id?: number;
  stock?: number;
  costo_base?: number;
  costo_actual?: number;
  cantidad?: number;
  razon_social?: string;
  cuit?: string;
  direccion?: string;
}

@Component({
  selector: 'app-search-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-selector.component.html',
  styleUrls: ['./search-selector.component.css']
})
export class SearchSelectorComponent implements OnInit {
  @Input() placeholder: string = 'Buscar...';
  @Input() disabled: boolean = false;
  @Input() type: 'cliente' | 'equipo' | 'tecnico' | 'repuesto' | 'proveedor' = 'cliente'; // AGREGADO 'proveedor'
  @Input() selectedItem: SearchResult | null = null;
  @Input() preloadOnFocus: boolean = true;
  
  @Output() search = new EventEmitter<string>();
  @Output() selectItem = new EventEmitter<SearchResult>();
  @Output() clearSelection = new EventEmitter<void>();
  @Output() focus = new EventEmitter<void>();
  @Output() loadInitialData = new EventEmitter<void>();

  @ViewChild('searchInput', { static: false }) searchInput!: ElementRef<HTMLInputElement>;

  searchTerm: string = '';
  showSuggestions: boolean = false;
  suggestions: SearchResult[] = [];
  hasSearched: boolean = false;

  _showNoClientMessage: boolean = false;
  _showNoResultsMessage: boolean = false;
  _showNoEquiposMessage: boolean = false;
  _showNoRepuestosMessage: boolean = false;

  ngOnInit() {
    if (!this.placeholder.includes('para buscar') && !this.placeholder.includes('Buscar')) {
      this.placeholder = `${this.placeholder} (escribe al menos 2 caracteres)`;
    }
  }

  updateSuggestions(results: SearchResult[]) {
    this.suggestions = results;
    this.showSuggestions = results.length > 0;
    this.hasSearched = true;
    
    this._showNoResultsMessage = false;
    this._showNoRepuestosMessage = false;
  }

  showMessage(type: 'noClient' | 'noResults' | 'noEquipos' | 'noRepuestos', show: boolean): void {
    switch (type) {
      case 'noClient':
        this._showNoClientMessage = show;
        break;
      case 'noResults':
        this._showNoResultsMessage = show;
        break;
      case 'noEquipos':
        this._showNoEquiposMessage = show;
        break;
      case 'noRepuestos':
        this._showNoRepuestosMessage = show;
        break;
    }
  }

  onSearch(term: string) {
    this.searchTerm = term;
    
    if (!term || term.trim().length < 2) {
      this.suggestions = [];
      this.showSuggestions = false;
      this.hasSearched = false;
      return;
    }
    
    if (term.length >= 2) {
      this.search.emit(term);
      this.hasSearched = true;
      this._showNoResultsMessage = false;
      this._showNoRepuestosMessage = false;
    }
  }

  onFocus() {
    this.focus.emit();
    
    if (this.preloadOnFocus && !this.hasSearched && !this.selectedItem && !this.searchTerm) {
      this.loadInitialData.emit();
    }
    
    if (this.suggestions.length > 0 && this.searchTerm && this.searchTerm.length >= 2) {
      this.showSuggestions = true;
    }
  }

  onBlur() {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  onSelect(item: SearchResult) {
    this.selectItem.emit(item);
    this.searchTerm = this.getDisplayText(item);
    this.showSuggestions = false;
    this.suggestions = [];
    this.clearMessages();
  }

  onClear() {
    this.searchTerm = '';
    this.selectedItem = null;
    this.suggestions = [];
    this.showSuggestions = false;
    this.hasSearched = false;
    this.clearSelection.emit();
    this.clearMessages();
    
    if (this.searchInput) {
      this.searchInput.nativeElement.focus();
    }
  }

  getInputWidth(): number {
    return this.searchInput ? this.searchInput.nativeElement.offsetWidth : 0;
  }

  getDisplayText(item: SearchResult): string {
    switch (this.type) {
      case 'cliente':
        return item.nombre || '';
      case 'equipo':
        return `${item.descripcion || ''} ${item.modelo ? `(${item.modelo})` : ''}`.trim();
      case 'tecnico':
        return item.nombre || '';
      case 'repuesto':
        return `${item.nombre || ''} ${item.stock !== undefined ? `(Stock: ${item.stock})` : ''}`.trim();
      case 'proveedor':
        return item.nombre || item.razon_social || '';
      default:
        return item.nombre || item.descripcion || '';
    }
  }

  getHeaderText(): string {
    switch (this.type) {
      case 'cliente':
        return 'Clientes encontrados';
      case 'equipo':
        return 'Equipos encontrados';
      case 'tecnico':
        return 'Técnicos disponibles';
      case 'repuesto':
        return 'Repuestos disponibles';
      case 'proveedor':
        return 'Proveedores encontrados';
      default:
        return 'Resultados';
    }
  }

  getHeaderIcon(): string {
    switch (this.type) {
      case 'cliente':
        return 'bi-people';
      case 'equipo':
        return 'bi-pc';
      case 'tecnico':
        return 'bi-person-gear';
      case 'repuesto':
        return 'bi-tools';
      case 'proveedor':
        return 'bi-building';
      default:
        return 'bi-search';
    }
  }

  getDetailsText(item: SearchResult): string {
    switch (this.type) {
      case 'cliente':
        return `${item.email || ''} ${item.telefono ? '| ' + item.telefono : ''}`.trim();
      case 'equipo':
        return `${item.marca || ''} ${item.modelo || ''} ${item.nro_serie ? '| Serie: ' + item.nro_serie : ''}`.trim();
      case 'tecnico':
        return item.tipo || '';
      case 'repuesto':
        const costo = item.costo_base ? `Costo: $${item.costo_base}` : '';
        const stock = item.stock !== undefined ? `Stock: ${item.stock}` : '';
        return [costo, stock].filter(Boolean).join(' | ');
      case 'proveedor':
        const cuit = item.cuit ? `CUIT: ${item.cuit}` : '';
        const telefono = item.telefono ? `Tel: ${item.telefono}` : '';
        return [cuit, telefono].filter(Boolean).join(' | ');
      default:
        return '';
    }
  }

  getCurrentMessage(): string {
    if (this._showNoClientMessage) {
      return 'Primero selecciona un cliente';
    }
    if (this._showNoResultsMessage) {
      return 'No se encontraron resultados';
    }
    if (this._showNoEquiposMessage) {
      return 'Este cliente no tiene equipos registrados';
    }
    if (this._showNoRepuestosMessage) {
      return 'No hay repuestos disponibles';
    }
    return '';
  }

  hasMessage(): boolean {
    return this._showNoClientMessage || this._showNoResultsMessage || 
           this._showNoEquiposMessage || this._showNoRepuestosMessage;
  }

  private clearMessages(): void {
    this._showNoClientMessage = false;
    this._showNoResultsMessage = false;
    this._showNoEquiposMessage = false;
    this._showNoRepuestosMessage = false;
  }

  clearAll() {
    this.searchTerm = '';
    this.selectedItem = null;
    this.suggestions = [];
    this.showSuggestions = false;
    this.hasSearched = false;
    this.clearMessages();
  }
}