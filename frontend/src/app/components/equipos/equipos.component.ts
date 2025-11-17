import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { EquipoService, Equipo, PaginatedResponse } from '../../services/equipos';
import { ClienteService } from '../../services/cliente.service';
import { SearchService } from '../../services/busquedaglobal';
import { SearchSelectorComponent, SearchResult } from '../search-selector/search-selector.component';

type Accion = 'listar' | 'crear';
type EquipoUI = Equipo;

@Component({
  selector: 'app-equipos',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchSelectorComponent],
  templateUrl: './equipos.component.html',
  styleUrls: ['./equipos.component.css']
})
export class EquiposComponent implements OnInit, OnDestroy {
  selectedAction: Accion = 'listar';
  
  protected equiposAll: EquipoUI[] = [];
  equipos: EquipoUI[] = [];

  page = 1;
  perPage = 15;
  lastPage = false;
  loading = false;

  // Edición inline
  editingId: number | null = null;
  editBuffer: Partial<EquipoUI> = {
    descripcion: '',
    cliente_id: undefined
  };

  // Creación
  nuevo: Partial<EquipoUI> = {
    descripcion: '',
    cliente_id: undefined
  };

  // Búsqueda global
  private searchSub?: Subscription;
  searchTerm = '';

  // Selección de cliente
  clienteSeleccionado: SearchResult | null = null;

  // Referencias a componentes de búsqueda
  @ViewChild('clienteSelector') clienteSelector!: SearchSelectorComponent;

  constructor(
    private equipoService: EquipoService,
    private clienteService: ClienteService,
    public searchService: SearchService
  ) {}

  ngOnInit(): void {
    this.resetLista();
    this.configurarBusqueda();
    window.addEventListener('scroll', this.onScroll, { passive: true });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    this.searchSub?.unsubscribe();
    this.searchService.clearSearch();
  }

  // ====== CONFIGURACIÓN DE BÚSQUEDA ======
  configurarBusqueda() {
    this.searchService.setCurrentComponent('equipos');
    this.searchSub = this.searchService.searchTerm$.subscribe(term => {
      this.searchTerm = (term || '').trim();
      this.applyFilter();
    });
  }

  // ====== BÚSQUEDA DE CLIENTES ======
  buscarClientes(termino: string) {
    if (termino.length < 2) {
      this.clienteSelector.updateSuggestions([]);
      return;
    }

    this.clienteService.buscarClientes(termino).subscribe({
      next: (clientes: SearchResult[]) => {
        this.clienteSelector.updateSuggestions(clientes);
      },
      error: (e) => {
        this.clienteSelector.updateSuggestions([]);
      }
    });
  }

  cargarClientesIniciales() {
    this.clienteService.getClientes(1, 10).subscribe({
      next: (res: any) => {
        const clientes = res.data ?? res;
        this.clienteSelector.updateSuggestions(clientes.slice(0, 5));
      },
      error: (e) => {
        this.clienteSelector.updateSuggestions([]);
      }
    });
  }

  seleccionarCliente(cliente: SearchResult) {
    this.clienteSeleccionado = cliente;
    this.nuevo.cliente_id = cliente.id;
  }

  limpiarCliente() {
    this.clienteSeleccionado = null;
    this.nuevo.cliente_id = undefined;
  }

  // ====== LISTA / PAGINACIÓN ======
  private fetch(page = 1): void {
    if (this.loading || this.lastPage) return;
    this.loading = true;

    this.equipoService.getEquipos(page, this.perPage).subscribe({
      next: (res: PaginatedResponse<Equipo>) => {
        const batch = (res.data as EquipoUI[]) ?? [];

        if (page === 1) {
          this.equiposAll = batch;
        } else {
          this.equiposAll = [...this.equiposAll, ...batch];
        }

        this.page = res.current_page ?? page;
        this.lastPage = res.last_page === 0 || (res.current_page ?? page) >= (res.last_page ?? page);

        this.applyFilter();
        this.searchService.setSearchData(this.equiposAll);
        this.loading = false;
      },
      error: (e) => {
        console.error('Error al obtener equipos', e);
        this.loading = false;
      }
    });
  }

  cargar(): void { 
    this.fetch(this.page === 0 ? 1 : this.page); 
  }

  onScroll = () => {
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 120;
    if (nearBottom && !this.loading && !this.lastPage) {
      this.fetch(this.page + 1);
    }
  };

  resetLista(): void {
    this.page = 1;
    this.lastPage = false;
    this.equiposAll = [];
    this.equipos = [];
    this.fetch(1);
  }

  private applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    if (!term) {
      this.equipos = [...this.equiposAll];
      return;
    }

    this.equipos = this.searchService.search(this.equiposAll, term, 'equipos');
  }

  // ====== CREAR EQUIPO ======
  crear(): void {
    const payload = this.limpiarPayload(this.nuevo);
    if (!this.validarPayload(payload)) return;

    this.equipoService.createEquipo(payload).subscribe({
      next: () => {
        this.selectedAction = 'listar';
        this.nuevo = { descripcion: '', cliente_id: undefined };
        this.limpiarCliente();
        this.resetLista();
        alert('Equipo creado exitosamente!');
      },
      error: (e) => {
        console.error('Error al crear equipo', e);
        alert(e?.error?.error ?? 'Error al crear equipo');
      }
    });
  }

  // ====== ELIMINAR EQUIPO ======
  eliminar(id: number): void {
    if (!confirm('¿Eliminar este equipo?')) return;

    this.equipoService.deleteEquipo(id).subscribe({
      next: () => {
        this.equiposAll = this.equiposAll.filter(x => x.id !== id);
        this.applyFilter();
        this.searchService.setSearchData(this.equiposAll);
        alert('Equipo eliminado exitosamente!');
      },
      error: (e) => { 
        console.error('Error al eliminar equipo', e);
        alert('Error al eliminar el equipo');
      }
    });
  }

  // ====== EDICIÓN INLINE ======
  startEdit(item: EquipoUI): void {
    this.editingId = item.id;
    this.editBuffer = {
      descripcion: item.descripcion ?? '',
      cliente_id: item.cliente_id ?? undefined
    };
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editBuffer = {};
  }

  saveEdit(id: number): void {
    const payload = this.limpiarPayload(this.editBuffer);
    if (!this.validarPayload(payload)) return;

    this.equipoService.updateEquipo(id, payload).subscribe({
      next: () => {
        const updateLocal = (arr: EquipoUI[]) => {
          const idx = arr.findIndex(x => x.id === id);
          if (idx >= 0) arr[idx] = { ...arr[idx], ...payload } as EquipoUI;
        };

        updateLocal(this.equiposAll);
        updateLocal(this.equipos);

        this.searchService.setSearchData(this.equiposAll);
        this.cancelEdit();
        alert('Equipo actualizado exitosamente!');
      },
      error: (e) => {
        console.error('Error al actualizar equipo', e);
        alert(e?.error?.error ?? 'No se pudo actualizar el equipo');
      }
    });
  }

  // ====== HELPERS ======
  private limpiarPayload(obj: Partial<EquipoUI>): Partial<EquipoUI> {
    return {
      descripcion: obj.descripcion?.toString().trim(),
      cliente_id: obj.cliente_id
    };
  }

  private validarPayload(p: any): boolean {
    if (!p.descripcion) {
      alert('Completá la descripción del equipo.');
      return false;
    }
    if (!p.cliente_id) {
      alert('Debes seleccionar un cliente.');
      return false;
    }
    return true;
  }

  getClienteNombre(clienteId: number | null | undefined): string {
    if (!clienteId) return 'Sin cliente';
    // Esto se puede mejorar cacheando los clientes si es necesario
    return `Cliente #${clienteId}`;
  }

  seleccionarAccion(a: Accion) { 
    this.selectedAction = a; 
  }

  limpiarBusqueda() {
    this.searchService.clearSearch();
  }
}