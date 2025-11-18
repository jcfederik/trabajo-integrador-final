import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ClienteService, Cliente, PaginatedResponse } from '../../services/cliente.service';
import { SearchService } from '../../services/busquedaglobal';

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
  selectedAction: Accion = 'listar';
  
  clientesAll: ClienteUI[] = [];
  clientes: ClienteUI[] = [];

  page = 1;
  perPage = 15;
  lastPage = false;
  loading = false;

  // Búsqueda global
  private searchSub?: Subscription;
  searchTerm = '';

  // Búsqueda en servidor
  private isServerSearch = false;
  private serverSearchPage = 1;
  private serverSearchLastPage = false;

  // Sugerencias y búsqueda en tiempo real
  mostrandoSugerencias = false;
  buscandoClientes = false;

  // Edición inline
  editingId: number | null = null;
  editBuffer: Partial<ClienteUI> = {
    nombre: '',
    email: '',
    telefono: ''
  };

  // Creación
  nuevo: Partial<ClienteUI> = {
    nombre: '',
    email: '',
    telefono: ''
  };

  constructor(
    private clienteService: ClienteService,
    private searchService: SearchService
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
    this.searchService.setCurrentComponent('clientes');
    this.searchSub = this.searchService.searchTerm$.subscribe(term => {
      this.searchTerm = (term || '').trim();
      this.applyFilter();
    });
  }

  // ====== LISTA / PAGINACIÓN ======
  private fetch(page = 1): void {
    if (this.loading || this.lastPage) return;
    this.loading = true;

    this.clienteService.getClientes(page, this.perPage).subscribe({
      next: (res: PaginatedResponse<Cliente>) => {
        const batch = res.data ?? [];

        if (page === 1) {
          this.clientesAll = batch;
        } else {
          this.clientesAll = [...this.clientesAll, ...batch];
        }

        this.page = res.current_page ?? page;
        this.lastPage = res.last_page === 0 || (res.current_page ?? page) >= (res.last_page ?? page);

        this.applyFilter();
        this.searchService.setSearchData(this.clientesAll);
        this.loading = false;
      },
      error: (e) => {
        console.error('Error al obtener clientes', e);
        this.loading = false;
      }
    });
  }

  cargar(): void { 
    this.fetch(this.page === 0 ? 1 : this.page); 
  }

  onScroll = () => {
    if (this.loading) return;
    
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 120;
    
    if (nearBottom) {
      if (this.isServerSearch && !this.serverSearchLastPage) {
        this.buscarEnServidor(this.searchTerm);
      } else if (!this.isServerSearch && !this.lastPage) {
        this.fetch(this.page + 1);
      }
    }
  };

  resetLista(): void {
    this.page = 1;
    this.lastPage = false;
    this.serverSearchPage = 1;
    this.serverSearchLastPage = false;
    this.isServerSearch = false;
    this.clientesAll = [];
    this.clientes = [];
    
    if (this.searchTerm) {
      this.applyFilter();
    } else {
      this.fetch(1);
    }
  }

  // ====== BÚSQUEDA Y FILTROS ======
  private applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    
    if (!term) {
      this.clientes = [...this.clientesAll];
      this.isServerSearch = false;
      this.serverSearchPage = 1;
      this.serverSearchLastPage = false;
      this.mostrandoSugerencias = false;
      return;
    }

    // Búsqueda en servidor para términos largos
    if (term.length > 2) {
      this.buscarEnServidor(term);
    } else {
      // Búsqueda local para términos cortos
      this.isServerSearch = false;
      this.clientes = this.clientesAll.filter(c =>
        c.nombre.toLowerCase().includes(term) ||
        (c.email?.toLowerCase().includes(term) ?? false) ||
        (c.telefono?.toLowerCase().includes(term) ?? false)
      );
      this.mostrandoSugerencias = this.clientes.length > 0;
    }
  }

  // ====== BÚSQUEDA EN SERVIDOR ======
  private buscarEnServidor(termino: string): void {
    if (this.loading) return;
    
    this.isServerSearch = true;
    this.loading = true;
    this.buscandoClientes = true;

    console.log('🔍 Buscando clientes en servidor:', termino, 'Página:', this.serverSearchPage);

    this.searchService.searchOnServer('clientes', termino, this.serverSearchPage, this.perPage).subscribe({
      next: (res: any) => {
        console.log('✅ Respuesta del servidor para clientes:', res);
        
        const clientesData = res.data || [];
        
        if (this.serverSearchPage === 1) {
          this.clientesAll = clientesData;
        } else {
          this.clientesAll = [...this.clientesAll, ...clientesData];
        }
        
        this.clientes = [...this.clientesAll];
        this.serverSearchPage++;
        this.serverSearchLastPage = res.current_page >= res.last_page;
        this.loading = false;
        this.buscandoClientes = false;
        this.mostrandoSugerencias = this.clientes.length > 0;

        console.log('✅ Búsqueda de clientes completada. Resultados:', this.clientes.length);
      },
      error: (error) => {
        console.error('❌ Error en búsqueda servidor de clientes:', error);
        this.loading = false;
        this.buscandoClientes = false;
        this.isServerSearch = false;
        // Fallback a búsqueda local
        this.clientes = this.clientesAll.filter(c =>
          c.nombre.toLowerCase().includes(termino) ||
          (c.email?.toLowerCase().includes(termino) ?? false) ||
          (c.telefono?.toLowerCase().includes(termino) ?? false)
        );
        this.mostrandoSugerencias = this.clientes.length > 0;
      }
    });
  }

  // ====== MÉTODOS DE BÚSQUEDA EN TIEMPO REAL ======
  onBuscarClientes(termino: string): void {
    if (termino.length > 0) {
      this.mostrandoSugerencias = true;
      this.applyFilter();
    } else {
      this.mostrandoSugerencias = false;
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

  limpiarBusqueda() {
    this.searchService.clearSearch();
  }

  // ====== CREAR CLIENTE ======
  crear(): void {
    const payload = this.limpiarPayload(this.nuevo);
    if (!this.validarPayload(payload)) return;

    this.clienteService.createCliente(payload).subscribe({
      next: (response: any) => {
        const nuevoCliente = response.cliente || response;
        const clienteCompleto = { ...payload, id: nuevoCliente.id } as ClienteUI;
        
        // Agregar al inicio de las listas
        this.clientesAll.unshift(clienteCompleto);
        this.applyFilter();
        
        this.searchService.setSearchData(this.clientesAll);
        
        this.selectedAction = 'listar';
        this.nuevo = { nombre: '', email: '', telefono: '' };
        alert('Cliente creado exitosamente!');
      },
      error: (e) => {
        console.error('Error al crear cliente', e);
        alert(e?.error?.error ?? 'Error al crear cliente');
      }
    });
  }

  // ====== ELIMINAR CLIENTE ======
  eliminar(id: number): void {
    if (!confirm('¿Eliminar este cliente?')) return;

    this.clienteService.deleteCliente(id).subscribe({
      next: () => {
        this.clientesAll = this.clientesAll.filter(x => x.id !== id);
        this.applyFilter();
        this.searchService.setSearchData(this.clientesAll);
        alert('Cliente eliminado exitosamente!');
      },
      error: (e) => { 
        console.error('Error al eliminar cliente', e);
        alert(e?.error?.error ?? 'Error al eliminar el cliente');
      }
    });
  }

  // ====== EDICIÓN INLINE ======
  startEdit(item: ClienteUI): void {
    this.editingId = item.id!;
    this.editBuffer = {
      nombre: item.nombre ?? '',
      email: item.email ?? '',
      telefono: item.telefono ?? ''
    };
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editBuffer = {
      nombre: '',
      email: '',
      telefono: ''
    };
  }

  saveEdit(id: number): void {
    const payload = this.limpiarPayload(this.editBuffer);
    if (!this.validarPayload(payload)) return;

    this.clienteService.updateCliente(id, payload).subscribe({
      next: (response: any) => {
        const clienteActualizado = response.cliente || response;
        
        const updateLocal = (arr: ClienteUI[]) => {
          const idx = arr.findIndex(x => x.id === id);
          if (idx >= 0) {
            arr[idx] = { 
              ...arr[idx], 
              ...clienteActualizado 
            } as ClienteUI;
          }
        };

        updateLocal(this.clientesAll);
        updateLocal(this.clientes);

        this.searchService.setSearchData(this.clientesAll);
        this.cancelEdit();
        alert('Cliente actualizado exitosamente!');
      },
      error: (e) => {
        console.error('Error al actualizar cliente', e);
        alert(e?.error?.error ?? 'No se pudo actualizar el cliente');
      }
    });
  }

  // ====== HELPERS ======
  private limpiarPayload(obj: Partial<ClienteUI>): Partial<ClienteUI> {
    return {
      nombre: obj.nombre?.toString().trim(),
      email: obj.email?.toString().trim(),
      telefono: obj.telefono?.toString().trim()
    };
  }

  private validarPayload(p: any): boolean {
    if (!p.nombre || p.nombre.trim() === '') {
      alert('Completá el nombre del cliente.');
      return false;
    }
    if (!p.email || p.email.trim() === '') {
      alert('Completá el email del cliente.');
      return false;
    }
    return true;
  }

  seleccionarAccion(a: Accion) { 
    this.selectedAction = a; 
  }
}