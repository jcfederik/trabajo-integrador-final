import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { EquipoService, Equipo, PaginatedResponse } from '../../services/equipos';
import { ClienteService } from '../../services/cliente.service';
import { SearchService } from '../../services/busquedaglobal';

type Accion = 'listar' | 'crear';
type EquipoUI = Equipo;

@Component({
  selector: 'app-equipos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './equipos.component.html',
  styleUrls: ['./equipos.component.css'],
})
export class EquiposComponent implements OnInit, OnDestroy {

  selectedAction: Accion = 'listar';
  
  private equiposAll: EquipoUI[] = [];
  equipos: EquipoUI[] = [];

  clientes: any[] = [];

  page = 1;
  perPage = 15;
  lastPage = false;
  loading = false;

  // =============== BÚSQUEDA GLOBAL ===============
  searchSub!: Subscription;
  searchTerm = '';
  mostrandoSugerencias = false;
  buscandoEquipos = false;
  private isServerSearch = false;
  private serverSearchPage = 1;
  private serverSearchLastPage = false;
  private busquedaEquipo = new Subject<string>();

  editingId: number | null = null;
  editBuffer: Partial<EquipoUI> = {
    descripcion: '',
    cliente_id: undefined
  };

  nuevo: Partial<EquipoUI> = {
    descripcion: '',
    cliente_id: undefined
  };

  constructor(
    private equipoService: EquipoService,
    private clienteService: ClienteService,
    public searchService: SearchService
  ) {}

  ngOnInit(): void {
    this.resetLista();
    this.cargarClientes();

    this.searchService.setCurrentComponent('equipos');
    this.configurarBusquedaGlobal();
    this.configurarBusquedaEquipos();

    window.addEventListener('scroll', this.onScroll, { passive: true });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    this.searchSub?.unsubscribe();
    this.busquedaEquipo.unsubscribe();
    this.searchService.clearSearch();
  }

  // =============== CONFIGURACIÓN DE BÚSQUEDAS ===============
  private configurarBusquedaGlobal(): void {
    this.searchSub = this.searchService.searchTerm$.subscribe(term => {
      this.searchTerm = (term || '').trim();
      
      if (this.searchTerm) {
        this.onBuscarEquipos(this.searchTerm);
      } else {
        this.resetBusqueda();
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

  // =============== BÚSQUEDA GLOBAL DE EQUIPOS ===============
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
      // Búsqueda local para términos cortos
      this.applyFilterLocal();
      this.buscandoEquipos = false;
    } else {
      // Búsqueda en servidor para términos largos
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
        
        // Actualizar datos para búsqueda local
        const itemsForSearch = this.equiposAll.map(equipo => ({
          ...equipo,
          cliente_nombre: this.getClienteNombre(equipo.cliente_id)
        }));
        this.searchService.setSearchData(itemsForSearch);
      },
      error: (error) => {
        console.error('Error en búsqueda servidor:', error);
        this.applyFilterLocal();
        this.buscandoEquipos = false;
      }
    });
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

  private applyFilter(): void {
    if (this.isServerSearch && this.searchTerm) {
      this.applyFilterLocal();
    } else {
      this.equipos = [...this.equiposAll];
    }
  }

  cerrarMenuSugerencias(): void {
    this.mostrandoSugerencias = false;
  }

  ocultarSugerencias(): void {
    setTimeout(() => {
      this.mostrandoSugerencias = false;
    }, 200);
  }

  private resetBusqueda(): void {
    this.isServerSearch = false;
    this.serverSearchPage = 1;
    this.serverSearchLastPage = false;
    this.mostrandoSugerencias = false;
    this.buscandoEquipos = false;
    this.equipos = [...this.equiposAll];
  }

  // =============== CARGA DE DATOS ===============
  cargarClientes() {
    this.clienteService.getClientes(1, 999).subscribe({
      next: (res: any) => {
        this.clientes = res.data ?? res;
      },
      error: (err) => {
        console.error("Error al cargar clientes", err);
      }
    });
  }

  seleccionarAccion(a: Accion) { this.selectedAction = a; }

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

        this.page = res.current_page;
        this.lastPage = res.last_page === 0 || res.current_page >= res.last_page;

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

  cargar(): void { this.fetch(this.page === 0 ? 1 : this.page); }

  onScroll = () => {
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 120;
    if (nearBottom && !this.loading && !this.lastPage) {
      if (this.isServerSearch && this.searchTerm && !this.serverSearchLastPage) {
        this.cargarMasResultadosBusqueda();
      } else if (!this.searchTerm) {
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
          
          // Actualizar datos para búsqueda local
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
        console.error('Error cargando más resultados:', error);
        this.loading = false;
        this.serverSearchLastPage = true;
      }
    });
  }

  resetLista(): void {
    this.equiposAll = [];
    this.equipos = [];
    this.page = 1;
    this.lastPage = false;
    this.searchTerm = '';
    this.isServerSearch = false;
    this.serverSearchPage = 1;
    this.serverSearchLastPage = false;
    this.mostrandoSugerencias = false;
    this.searchService.clearSearch();
    this.fetch(1);
  }

  // =============== CREAR ===============
  crear(): void {
    const payload = this.limpiar(this.nuevo);
    if (!this.valida(payload)) return;

    this.equipoService.createEquipo(payload).subscribe({
      next: () => {
        this.selectedAction = 'listar';
        this.nuevo = { descripcion: '', cliente_id: undefined };
        this.resetLista();
      },
      error: (e) => {
        console.error('Error al crear equipo', e);
        alert(e?.error?.error ?? 'Error al crear equipo');
      }
    });
  }

  // =============== ELIMINAR ===============
  eliminar(id: number): void {
    if (!confirm('¿Eliminar este equipo?')) return;

    this.equipoService.deleteEquipo(id).subscribe({
      next: () => {
        this.equiposAll = this.equiposAll.filter(x => x.id !== id);
        this.applyFilter();
        this.searchService.setSearchData(this.equiposAll);
      },
      error: (e) => { console.error('Error al eliminar equipo', e); }
    });
  }

  // =============== EDICIÓN INLINE ===============
  startEdit(item: EquipoUI): void {
    this.editingId = item.id;
    this.editBuffer = {
      descripcion: (item as any)?.descripcion ?? '',
      cliente_id: (item as any)?.cliente_id ?? undefined
    };
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editBuffer = {};
  }

  saveEdit(id: number): void {
    const payload = this.limpiar(this.editBuffer);
    if (!this.valida(payload)) return;

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
      },
      error: (e) => {
        console.error('Error al actualizar equipo', e);
        alert(e?.error?.error ?? 'No se pudo actualizar');
      }
    });
  }

  // =============== HELPERS ===============
  private limpiar(obj: Partial<EquipoUI>): Partial<EquipoUI> {
    return {
      descripcion: obj.descripcion?.toString().trim(),
      cliente_id: obj.cliente_id
    };
  }

  private valida(p: any): boolean {
    if (!p.descripcion) {
      alert('Completá la descripción.');
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
    const cli = this.clientes.find(c => c.id === clienteId);
    return cli ? cli.nombre : `Cliente #${clienteId}`;
  }

  getClienteTelefono(clienteId: number | null | undefined): string | null {
    if (!clienteId) return null;
    const cli = this.clientes.find(c => c.id === clienteId);
    return cli?.telefono ?? null;
  }
}