import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SearchResult {
  id: number;
  nombre?: string;
  descripcion?: string;
  email?: string;
  telefono?: string;
  tipo?: string;
  marca?: string;
  modelo?: string;
  nro_serie?: string;
  cliente_id?: number;
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
  @Input() type: 'cliente' | 'equipo' | 'tecnico' = 'cliente';
  @Input() selectedItem: SearchResult | null = null;
  @Input() preloadOnFocus: boolean = true; // Nueva propiedad para cargar al hacer focus
  
  @Output() search = new EventEmitter<string>();
  @Output() selectItem = new EventEmitter<SearchResult>();
  @Output() clearSelection = new EventEmitter<void>();
  @Output() focus = new EventEmitter<void>();
  @Output() loadInitialData = new EventEmitter<void>(); // Nuevo evento para cargar datos iniciales

  @ViewChild('searchInput', { static: false }) searchInput!: ElementRef<HTMLInputElement>;

  searchTerm: string = '';
  showSuggestions: boolean = false;
  suggestions: SearchResult[] = [];
  hasSearched: boolean = false;

  ngOnInit() {
    // Configurar placeholder dinámico con instrucción
    if (!this.placeholder.includes('para buscar')) {
      this.placeholder = `${this.placeholder} (escribe al menos 2 caracteres)`;
    }
  }

  // Método para actualizar sugerencias desde el componente padre
  updateSuggestions(results: SearchResult[]) {
    this.suggestions = results;
    this.showSuggestions = results.length > 0;
    this.hasSearched = true;
  }

  onSearch(term: string) {
    this.searchTerm = term;
    if (term.length >= 2) {
      this.search.emit(term);
      this.hasSearched = true;
    } else {
      this.suggestions = [];
      this.showSuggestions = false;
      // Si hay menos de 2 caracteres pero el usuario hizo focus y quiere ver datos, cargar iniciales
      if (term.length === 0 && this.preloadOnFocus) {
        this.loadInitialData.emit();
      }
    }
  }

  onSelect(item: SearchResult) {
    this.selectItem.emit(item);
    this.searchTerm = this.getDisplayText(item);
    this.showSuggestions = false;
    this.suggestions = []; // Limpiar sugerencias después de seleccionar
  }

  onClear() {
    this.searchTerm = '';
    this.selectedItem = null;
    this.suggestions = [];
    this.showSuggestions = false;
    this.hasSearched = false;
    this.clearSelection.emit();
    
    if (this.searchInput) {
      this.searchInput.nativeElement.focus();
    }
  }

  onFocus() {
    this.focus.emit();
    
    // Cargar datos iniciales al hacer focus si está habilitado
    if (this.preloadOnFocus && !this.hasSearched && !this.selectedItem) {
      this.loadInitialData.emit();
    }
    
    // Mostrar sugerencias si ya hay algunas
    if (this.suggestions.length > 0) {
      this.showSuggestions = true;
    }
  }

  onBlur() {
    // Pequeño delay para permitir el click en las sugerencias
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
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
      default:
        return '';
    }
  }

  // Método para limpiar completamente el componente
  clearAll() {
    this.searchTerm = '';
    this.selectedItem = null;
    this.suggestions = [];
    this.showSuggestions = false;
    this.hasSearched = false;
  }
}