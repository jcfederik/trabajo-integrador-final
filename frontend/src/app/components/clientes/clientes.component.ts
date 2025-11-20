import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ClienteService, Cliente, PaginatedResponse } from '../../services/cliente.service';
import { SearchService } from '../../services/busquedaglobal';
import { AlertService } from '../../services/alert.service';

type Accion = 'listar' | 'crear';
type ClienteUI = Cliente;

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})
export class ClientesComponent implements OnInit, OnDestroy {

  // =============== ESTADOS DEL COMPONENTE ===============
  selectedAction: Accion = 'listar';
  clientesAll: ClienteUI[] = [];
  clientes: ClienteUI[] = [];

  // =============== PAGINACIÓN ===============
  page = 1;
  perPage = 10;
  lastPage = false;
  loading = false;

  // =============== EDICIÓN ===============
  editingId: number | null = null;
  editBuffer: Partial<Cliente> = {
    nombre: '',
    email: '',
    telefono: ''
  };

  // =============== CREACIÓN ===============
  nuevo: Partial<Cliente> = {
    nombre: '',
    email: '',
    telefono: ''
  };

  // =============== BÚSQUEDA GLOBAL ===============
  private searchSub?: Subscription;
  searchTerm = '';
  private isServerSearch = false;
  private serverSearchPage = 1;
  private serverSearchLastPage = false;

  mostrandoSugerencias = false;
  buscandoClientes = false;

  constructor(
    private clienteService: ClienteService,
    private searchService: SearchService,
    private alertService: AlertService
  ) {}

  // =============== LIFECYCLE ===============
  ngOnInit(): void {
    this.cargar();
    window.addEventListener('scroll', this.onScroll, { passive: true });

    this.searchService.setCurrentComponent('clientes');
    this.searchSub = this.searchService.searchTerm$.subscribe(term => {
      this.searchTerm = (term || '').trim();
      this.applyFilter();
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    this.searchSub?.unsubscribe();
    this.searchService.clearSearch();
  }

  // =============== NAVEGACIÓN ===============
  seleccionarAccion(a: Accion) {
    this.selectedAction = a;
  }

  limpiarBusqueda() {
    this.searchService.clearSearch();
  }

  // =============== CARGA Y PAGINACIÓN ===============
  cargar(): void {
    if (this.loading || this.lastPage) return;
    this.loading = true;

    this.clienteService.getClientes(this.page, this.perPage).subscribe({
      next: (res: PaginatedResponse<Cliente>) => {
        this.clientesAll = [...this.clientesAll, ...res.data];
        this.applyFilter();

        this.page++;
        this.lastPage = res.current_page >= res.last_page;
        this.loading = false;

        this.searchService.setSearchData(this.clientesAll);
      },
      error: () => this.loading = false
    });
  }

  onScroll = () => {
    if (this.loading) return;

    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 120;

    if (nearBottom) {
      if (this.isServerSearch && !this.serverSearchLastPage) {
        this.buscarEnServidor(this.searchTerm);
      } else if (!this.isServerSearch && !this.lastPage) {
        this.cargar();
      }
    }
  };

  resetLista() {
    this.clientesAll = [];
    this.clientes = [];
    this.page = 1;
    this.lastPage = false;
    this.serverSearchPage = 1;
    this.serverSearchLastPage = false;
    this.isServerSearch = false;

    this.searchTerm ? this.applyFilter() : this.cargar();
  }

  // =============== BÚSQUEDA Y FILTRADO ===============
  applyFilter(): void {
    const term = this.searchTerm.toLowerCase();

    if (!term) {
      this.clientes = [...this.clientesAll];
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
      this.clientes = this.searchService.search(this.clientesAll, term, 'clientes');
      this.mostrandoSugerencias = this.clientes.length > 0;
    }
  }

  private buscarEnServidor(termino: string): void {
    if (this.loading) return;

    this.isServerSearch = true;
    this.loading = true;
    this.buscandoClientes = true;

    this.searchService.searchOnServer('clientes', termino, this.serverSearchPage, this.perPage).subscribe({
      next: (res: any) => {
        const clientesData = res.data || [];

        this.clientesAll = this.serverSearchPage === 1
          ? clientesData
          : [...this.clientesAll, ...clientesData];

        this.clientes = [...this.clientesAll];

        this.serverSearchPage++;
        this.serverSearchLastPage = res.current_page >= res.last_page;
        this.loading = false;
        this.buscandoClientes = false;
        this.mostrandoSugerencias = this.clientes.length > 0;
      },
      error: () => {
        this.loading = false;
        this.buscandoClientes = false;
        this.isServerSearch = false;

        this.clientes = this.searchService.search(this.clientesAll, termino, 'clientes');
        this.mostrandoSugerencias = this.clientes.length > 0;
      }
    });
  }

  // =============== CREACIÓN ===============
  async crear(): Promise<void> {
    const payload = this.limpiar(this.nuevo);
    if (!this.valida(payload)) return;

    this.alertService.showLoading('Creando cliente...');

    this.clienteService.createCliente(payload).subscribe({
      next: (nuevoCliente: any) => {
        this.alertService.closeLoading();
        const clienteCompleto = { ...payload, id: nuevoCliente.id } as Cliente;

        this.clientesAll.unshift(clienteCompleto);
        this.applyFilter();
        this.searchService.setSearchData(this.clientesAll);

        this.nuevo = { nombre: '', email: '', telefono: '' };
        this.selectedAction = 'listar';
        
        this.alertService.showClienteCreado(payload.nombre!);
      },
      error: (e) => {
        this.alertService.closeLoading();
        this.alertService.showGenericError('Error al crear el cliente');
      }
    });
  }

  // =============== ELIMINACIÓN ===============
  async eliminar(id: number): Promise<void> {
    const cliente = this.clientesAll.find(c => c.id === id);
    const confirmed = await this.alertService.confirmDeleteCliente(cliente?.nombre || 'este cliente');
    if (!confirmed) return;

    this.alertService.showLoading('Eliminando cliente...');

    this.clienteService.deleteCliente(id).subscribe({
      next: () => {
        this.alertService.closeLoading();
        this.clientesAll = this.clientesAll.filter(c => c.id !== id);
        this.applyFilter();
        this.searchService.setSearchData(this.clientesAll);
        this.alertService.showClienteEliminado(cliente?.nombre || 'Cliente');
      },
      error: (e) => {
        this.alertService.closeLoading();
        this.alertService.showGenericError('No se pudo eliminar el cliente');
      }
    });
  }

  // =============== EDICIÓN INLINE ===============
  startEdit(item: Cliente): void {
    this.editingId = item.id;
    this.editBuffer = {
      nombre: item.nombre,
      email: item.email,
      telefono: item.telefono
    };
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editBuffer = { nombre: '', email: '', telefono: '' };
  }

  async saveEdit(id: number): Promise<void> {
    const payload = this.limpiar(this.editBuffer);
    if (!this.valida(payload)) return;

    this.alertService.showLoading('Actualizando cliente...');

    this.clienteService.updateCliente(id, payload).subscribe({
      next: () => {
        this.alertService.closeLoading();
        const updateLocal = (arr: Cliente[]) => {
          const idx = arr.findIndex(c => c.id === id);
          if (idx >= 0) arr[idx] = { ...arr[idx], ...payload } as Cliente;
        };

        updateLocal(this.clientesAll);
        updateLocal(this.clientes);

        this.searchService.setSearchData(this.clientesAll);
        this.cancelEdit();

        this.alertService.showClienteActualizado(payload.nombre!);
      },
      error: (e) => {
        this.alertService.closeLoading();
        this.alertService.showGenericError('Error al actualizar el cliente');
      }
    });
  }

  // =============== VALIDACIÓN Y UTILIDADES ===============
  private limpiar(obj: Partial<Cliente>): Partial<Cliente> {
    return {
      nombre: (obj.nombre ?? '').trim(),
      email: (obj.email ?? '').trim(),
      telefono: (obj.telefono ?? '').trim()
    };
  }

  private valida(p: Partial<Cliente>): boolean {
    if (!p.nombre) { 
      this.alertService.showRequiredFieldError('nombre');
      return false; 
    }
    if (!p.email) { 
      this.alertService.showRequiredFieldError('email');
      return false; 
    }
    if (!p.telefono) { 
      this.alertService.showRequiredFieldError('teléfono');
      return false; 
    }
    return true;
  }
}