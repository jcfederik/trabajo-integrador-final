import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { EquipoService, Equipo, PaginatedResponse } from '../../services/equipos';
import { ClienteService } from '../../services/cliente.service';
import { SearchSelectorComponent, SearchResult } from '../search-selector/search-selector.component';
import { SearchService } from '../../services/busquedaglobal';
import { AlertService } from '../../services/alert.service';

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
  clientes: any[] = [];

  page = 1;
  perPage = 15;
  lastPage = false;
  loading = false;

  private searchSub?: Subscription;
  searchTerm = '';
  
  private isServerSearch = false;
  private serverSearchPage = 1;
  private serverSearchLastPage = false;
  private busquedaEquipo = new Subject<string>();

  mostrandoSugerencias = false;
  buscandoEquipos = false;

  editingId: number | null = null;
  editBuffer: Partial<EquipoUI> = {
    descripcion: '',
    cliente_id: undefined,
    marca: '',
    modelo: '',
    nro_serie: ''
  };
  clienteEditSeleccionado: SearchResult | null = null;

  nuevo: Partial<EquipoUI> = {
    descripcion: '',
    cliente_id: undefined,
    marca: '',
    modelo: '',
    nro_serie: ''
  };

  clienteSeleccionado: SearchResult | null = null;

  @ViewChild('clienteSelector') clienteSelector!: SearchSelectorComponent;
  @ViewChild('clienteEditSelector') clienteEditSelector!: SearchSelectorComponent;

  constructor(
    private equipoService: EquipoService,
    private clienteService: ClienteService,
    public searchService: SearchService,
    private alertService: AlertService
  ) {}

  // LIFECYCLE
  ngOnInit(): void {
    this.resetLista();
    this.cargarClientes();
    this.configurarBusqueda();
    this.configurarBusquedaEquipos();
    window.addEventListener('scroll', this.onScroll, { passive: true });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    this.searchSub?.unsubscribe();
    this.busquedaEquipo.unsubscribe();
    this.searchService.clearSearch();
  }

  // CONFIGURACIÓN DE BÚSQUEDA
  private configurarBusqueda(): void {
    this.searchService.setCurrentComponent('equipos');
    this.searchSub = this.searchService.searchTerm$.subscribe(term => {
      this.searchTerm = (term || '').trim();
      
      if (this.searchTerm) {
        this.onBuscarEquipos(this.searchTerm);
      } else {
        this.resetLista();
      }
    });
  }

  private configurarBusquedaEquipos(): void {
    this.busquedaEquipo.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(termino => {
      this.buscarEnServidor(termino);
    });
  }

  // BÚSQUEDA DE CLIENTES
  buscarClientes(termino: string): void {
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

  buscarClientesEdit(termino: string): void {
    if (termino.length < 2) {
      this.clienteEditSelector.updateSuggestions([]);
      return;
    }

    this.clienteService.buscarClientes(termino).subscribe({
      next: (clientes: SearchResult[]) => {
        this.clienteEditSelector.updateSuggestions(clientes);
      },
      error: (e) => {
        this.clienteEditSelector.updateSuggestions([]);
      }
    });
  }

  cargarClientesIniciales(): void {
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

  cargarClientesInicialesEdit(): void {
    this.clienteService.getClientes(1, 10).subscribe({
      next: (res: any) => {
        const clientes = res.data ?? res;
        this.clienteEditSelector.updateSuggestions(clientes.slice(0, 5));
      },
      error: (e) => {
        this.clienteEditSelector.updateSuggestions([]);
      }
    });
  }

  seleccionarCliente(cliente: SearchResult): void {
    this.clienteSeleccionado = cliente;
    this.nuevo.cliente_id = cliente.id;
  }

  seleccionarClienteEdit(cliente: SearchResult): void {
    this.clienteEditSeleccionado = cliente;
    this.editBuffer.cliente_id = cliente.id;
  }

  limpiarCliente(): void {
    this.clienteSeleccionado = null;
    this.nuevo.cliente_id = undefined;
  }

  limpiarClienteEdit(): void {
    this.clienteEditSeleccionado = null;
    this.editBuffer.cliente_id = undefined;
  }

  // BÚSQUEDA Y FILTROS
  onBuscarEquipos(termino: string): void {
    const terminoLimpio = (termino || '').trim();
    
    if (!terminoLimpio) {
      this.resetBusqueda();
      return;
    }

    this.searchTerm = terminoLimpio;
    this.mostrandoSugerencias = true;
    this.buscandoEquipos = true;

    if (terminoLimpio.length <= 2) {
      this.applyFilterLocal();
      this.buscandoEquipos = false;
    } else {
      this.busquedaEquipo.next(terminoLimpio);
    }
  }

  private buscarEnServidor(termino: string): void {
    this.isServerSearch = true;
    this.serverSearchPage = 1;
    this.serverSearchLastPage = false;

    this.searchService.searchOnServer('equipos', termino, 1, this.perPage).subscribe({
      next: (response: any) => {
        const equiposEncontrados = response.data || response;
        
        this.equiposAll = Array.isArray(equiposEncontrados) ? equiposEncontrados : [];
        this.equipos = [...this.equiposAll];
        
        this.buscandoEquipos = false;
        this.mostrandoSugerencias = true;
        
        const itemsForSearch = this.equiposAll.map(equipo => ({
          ...equipo,
          cliente_nombre: this.getClienteNombre(equipo.cliente_id)
        }));
        this.searchService.setSearchData(itemsForSearch);
      },
      error: (error) => {
        this.applyFilterLocal();
        this.buscandoEquipos = false;
      }
    });
  }

  private applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    
    if (!term) {
      this.equipos = [...this.equiposAll];
      this.isServerSearch = false;
      this.serverSearchPage = 1;
      this.serverSearchLastPage = false;
      this.mostrandoSugerencias = false;
      return;
    }

    if (term.length > 2) {
      this.buscarEnServidor(term);
    } else {
      this.isServerSearch = false;
      this.applyFilterLocal();
      this.mostrandoSugerencias = this.equipos.length > 0;
    }
  }

  private applyFilterLocal(): void {
    if (!this.searchTerm) {
      this.equipos = [...this.equiposAll];
      return;
    }

    const itemsWithClienteInfo = this.equiposAll.map(equipo => ({
      ...equipo,
      cliente_nombre: this.getClienteNombre(equipo.cliente_id)
    }));
    
    const filtered = this.searchService.search(itemsWithClienteInfo, this.searchTerm, 'equipos');
    this.equipos = filtered as EquipoUI[];
  }

  private resetBusqueda(): void {
    this.isServerSearch = false;
    this.serverSearchPage = 1;
    this.serverSearchLastPage = false;
    this.mostrandoSugerencias = false;
    this.buscandoEquipos = false;
    this.equipos = [...this.equiposAll];
  }

  // LISTA / PAGINACIÓN
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
        this.loading = false;
      }
    });
  }

  cargar(): void { 
    this.fetch(this.page === 0 ? 1 : this.page); 
  }

  onScroll = (): void => {
    if (this.loading) return;
    
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 120;
    
    if (nearBottom) {
      if (this.isServerSearch && !this.serverSearchLastPage) {
        this.cargarMasResultadosBusqueda();
      } else if (!this.isServerSearch && !this.lastPage) {
        this.fetch(this.page + 1);
      }
    }
  };

  private cargarMasResultadosBusqueda(): void {
    if (this.loading || this.serverSearchLastPage) return;
    
    this.loading = true;
    this.serverSearchPage++;

    this.searchService.searchOnServer('equipos', this.searchTerm, this.serverSearchPage, this.perPage).subscribe({
      next: (response: any) => {
        const nuevosEquipos = response.data || response;
        
        if (Array.isArray(nuevosEquipos) && nuevosEquipos.length > 0) {
          this.equiposAll = [...this.equiposAll, ...nuevosEquipos];
          this.equipos = [...this.equiposAll];
          
          const itemsForSearch = this.equiposAll.map(equipo => ({
            ...equipo,
            cliente_nombre: this.getClienteNombre(equipo.cliente_id)
          }));
          this.searchService.setSearchData(itemsForSearch);
        } else {
          this.serverSearchLastPage = true;
        }
        
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.serverSearchLastPage = true;
      }
    });
  }

  resetLista(): void {
    this.page = 1;
    this.lastPage = false;
    this.serverSearchPage = 1;
    this.serverSearchLastPage = false;
    this.isServerSearch = false;
    this.equiposAll = [];
    this.equipos = [];
    
    if (this.searchTerm) {
      this.applyFilter();
    } else {
      this.fetch(1);
    }
  }

  // CRUD OPERATIONS
  async crear(): Promise<void> {
    const payload = this.limpiarPayload(this.nuevo);
    if (!this.validarPayload(payload)) return;

    this.alertService.showLoading('Creando equipo...');

    this.equipoService.createEquipo(payload).subscribe({
      next: () => {
        this.alertService.closeLoading();
        this.selectedAction = 'listar';
        this.nuevo = { 
          descripcion: '', 
          cliente_id: undefined,
          marca: '',
          modelo: '',
          nro_serie: ''
        };
        this.limpiarCliente();
        this.resetLista();
        this.alertService.showEquipoCreado();
      },
      error: (e) => {
        this.alertService.closeLoading();
        this.alertService.showGenericError(e?.error?.error ?? 'Error al crear equipo');
      }
    });
  }

  async eliminar(id: number): Promise<void> {
    const equipo = this.equiposAll.find(e => e.id === id);
    const confirmed = await this.alertService.confirmDeleteEquipo(equipo?.descripcion || 'este equipo');
    if (!confirmed) return;

    this.alertService.showLoading('Eliminando equipo...');

    this.equipoService.deleteEquipo(id).subscribe({
      next: () => {
        this.alertService.closeLoading();
        this.equiposAll = this.equiposAll.filter(x => x.id !== id);
        this.applyFilter();
        this.searchService.setSearchData(this.equiposAll);
        this.alertService.showEquipoEliminado();
      },
      error: (e) => {
        this.alertService.closeLoading();
        this.alertService.showGenericError('Error al eliminar el equipo');
      }
    });
  }

  // EDICIÓN INLINE
  startEdit(item: EquipoUI): void {
    this.editingId = item.id;
    this.editBuffer = {
      descripcion: item.descripcion ?? '',
      cliente_id: item.cliente_id ?? undefined,
      marca: item.marca ?? '',
      modelo: item.modelo ?? '',
      nro_serie: item.nro_serie ?? ''
    };
    
    if (item.cliente_id) {
      const clienteActual = this.clientes.find(c => c.id === item.cliente_id);
      if (clienteActual) {
        this.clienteEditSeleccionado = {
          id: clienteActual.id,
          nombre: clienteActual.nombre,
          email: clienteActual.email,
          telefono: clienteActual.telefono
        };
      } else {
        this.clienteService.getCliente(item.cliente_id).subscribe({
          next: (cliente) => {
            this.clienteEditSeleccionado = {
              id: cliente.id,
              nombre: cliente.nombre,
              email: cliente.email,
              telefono: cliente.telefono
            };
          },
          error: (err) => {}
        });
      }
    } else {
      this.clienteEditSeleccionado = null;
    }
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editBuffer = {
      descripcion: '',
      cliente_id: undefined,
      marca: '',
      modelo: '',
      nro_serie: ''
    };
    this.clienteEditSeleccionado = null;
  }

  async saveEdit(id: number): Promise<void> {
    const payload = this.limpiarPayload(this.editBuffer);
    if (!this.validarPayload(payload)) return;

    this.alertService.showLoading('Actualizando equipo...');

    this.equipoService.updateEquipo(id, payload).subscribe({
      next: () => {
        this.alertService.closeLoading();
        this.actualizarEquipoLocal(id, payload);
        this.cancelEdit();
        this.alertService.showEquipoActualizado();
      },
      error: (e) => {
        this.alertService.closeLoading();
        this.alertService.showGenericError(e?.error?.error ?? 'No se pudo actualizar el equipo');
      }
    });
  }

  // HELPERS
  private limpiarPayload(obj: Partial<EquipoUI>): Partial<EquipoUI> {
    return {
      descripcion: obj.descripcion?.toString().trim(),
      cliente_id: obj.cliente_id,
      marca: obj.marca?.toString().trim(),
      modelo: obj.modelo?.toString().trim(),
      nro_serie: obj.nro_serie?.toString().trim()
    };
  }

  private validarPayload(p: any): boolean {
    if (!p.descripcion || p.descripcion.trim() === '') {
      this.alertService.showRequiredFieldError('descripción');
      return false;
    }
    if (!p.cliente_id) {
      this.alertService.showRequiredFieldError('cliente');
      return false;
    }
    return true;
  }

  private actualizarEquipoLocal(id: number, datosActualizados: Partial<EquipoUI>): void {
    const actualizarArray = (arr: EquipoUI[]) => {
      const idx = arr.findIndex(x => x.id === id);
      if (idx >= 0) {
        arr[idx] = { 
          ...arr[idx], 
          ...datosActualizados 
        } as EquipoUI;
      }
    };

    actualizarArray(this.equiposAll);
    actualizarArray(this.equipos);
    this.searchService.setSearchData(this.equiposAll);
  }

  private cargarClientes(): void {
    this.clienteService.getClientes(1, 999).subscribe({
      next: (res: any) => {
        this.clientes = res.data ?? res;
      },
      error: (err) => {}
    });
  }

  getClienteNombre(clienteId: number | null | undefined): string {
    if (!clienteId) return 'Sin cliente';
    const cli = this.clientes.find(c => c.id === clienteId);
    return cli ? cli.nombre : `Cliente #${clienteId}`;
  }

  seleccionarAccion(a: Accion): void { 
    this.selectedAction = a; 
  }

  limpiarBusqueda(): void {
    this.searchService.setSearchTerm('');
  }

  isListar(): boolean {
    return this.selectedAction === 'listar';
  }

  isCrear(): boolean {
    return this.selectedAction === 'crear';
  }
}