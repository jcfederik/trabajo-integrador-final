import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService, Cliente, PaginatedResponse } from '../../services/cliente.service';
import { SearchService } from '../../services/busquedaglobal';
import { Subscription } from 'rxjs';

type Accion = 'listar' | 'crear';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})
export class ClientesComponent implements OnInit, OnDestroy {
  selectedAction: Accion = 'listar';

  private clientesAll: Cliente[] = [];
  clientes: Cliente[] = [];
  page = 1;
  perPage = 10;
  lastPage = false;
  loading = false;

  editingId: number | null = null;
  editBuffer: Partial<Cliente> = {
    nombre: '',
    email: '',
    telefono: ''
  };

  nuevo: Partial<Cliente> = {
    nombre: '',
    email: '',
    telefono: ''
  };

  private searchSub?: Subscription;
  searchTerm = '';

  private isServerSearch = false;
  private serverSearchPage = 1;
  private serverSearchLastPage = false;

  // 🔥 NUEVO: Para manejar la búsqueda en tiempo real
  mostrandoSugerencias = false;
  buscandoClientes = false;

  constructor(
    private clienteService: ClienteService,
    private searchService: SearchService
  ) {}

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

  seleccionarAccion(a: Accion) { 
    this.selectedAction = a; 
  }

  cargar(): void {
    if (this.loading || this.lastPage) return;
    this.loading = true;

    this.clienteService.getClientes(this.page, this.perPage).subscribe({
      next: (res: PaginatedResponse<Cliente>) => {
        const nuevosClientes = [...this.clientesAll, ...res.data];
        this.clientesAll = nuevosClientes;
        
        this.applyFilter();
        this.page++;
        this.lastPage = res.current_page >= res.last_page;
        this.loading = false;

        this.searchService.setSearchData(this.clientesAll);
      },
      error: () => { 
        this.loading = false; 
      }
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
    
    if (this.searchTerm) {
      this.applyFilter();
    } else {
      this.cargar();
    }
  }

  // 🔥 ACTUALIZADO: Método mejorado para aplicar filtros
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

    // Búsqueda en servidor para términos largos
    if (term.length > 2) {
      this.buscarEnServidor(term);
    } else {
      // Búsqueda local para términos cortos
      this.isServerSearch = false;
      this.clientes = this.searchService.search(this.clientesAll, term, 'clientes');
      this.mostrandoSugerencias = this.clientes.length > 0;
    }
  }

  // 🔥 ACTUALIZADO: Búsqueda en servidor mejorada
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
        this.clientes = this.searchService.search(this.clientesAll, termino, 'clientes');
        this.mostrandoSugerencias = this.clientes.length > 0;
      }
    });
  }

  // 🔥 NUEVO: Método para búsqueda en tiempo real (opcional)
  onBuscarClientes(termino: string): void {
    if (termino.length > 0) {
      this.mostrandoSugerencias = true;
      this.applyFilter();
    } else {
      this.mostrandoSugerencias = false;
    }
  }

  // 🔥 NUEVO: Cerrar menú de sugerencias
  cerrarMenuSugerencias(): void {
    this.mostrandoSugerencias = false;
  }

  // 🔥 NUEVO: Ocultar sugerencias con delay (para blur)
  ocultarSugerencias(): void {
    setTimeout(() => {
      this.mostrandoSugerencias = false;
    }, 200);
  }

  crear(): void {
    const payload = this.limpiar(this.nuevo);
    if (!this.valida(payload)) return;

    this.clienteService.createCliente(payload).subscribe({
      next: (nuevoCliente: any) => {
        const clienteCompleto = { ...payload, id: nuevoCliente.id } as Cliente;
        this.clientesAll.unshift(clienteCompleto);
        this.applyFilter();
        
        this.searchService.setSearchData(this.clientesAll);
        
        this.nuevo = { 
          nombre: '', 
          email: '', 
          telefono: ''
        };
        this.selectedAction = 'listar';
      },
      error: (e) => { 
        alert(e?.error?.error ?? 'Error al crear el cliente'); 
      }
    });
  }

  eliminar(id: number): void {
    if (!confirm('¿Eliminar este cliente?')) return;
    
    this.clienteService.deleteCliente(id).subscribe({
      next: () => { 
        this.clientesAll = this.clientesAll.filter(c => c.id !== id);
        this.applyFilter();
        this.searchService.setSearchData(this.clientesAll);
      },
      error: (e) => { 
        alert(e?.error?.error ?? 'No se pudo eliminar'); 
      }
    });
  }

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
    this.editBuffer = {
      nombre: '',
      email: '',
      telefono: ''
    }; 
  }

  saveEdit(id: number): void {
    const payload = this.limpiar(this.editBuffer);
    if (!this.valida(payload)) return;

    this.clienteService.updateCliente(id, payload).subscribe({
      next: () => {
        const updateLocal = (arr: Cliente[]) => {
          const idx = arr.findIndex(c => c.id === id);
          if (idx >= 0) arr[idx] = { ...arr[idx], ...payload } as Cliente;
        };
        
        updateLocal(this.clientesAll);
        updateLocal(this.clientes);
        
        this.searchService.setSearchData(this.clientesAll);
        this.cancelEdit();
      },
      error: (e) => { 
        alert(e?.error?.error ?? 'Error al actualizar'); 
      }
    });
  }

  private limpiar(obj: Partial<Cliente>): Partial<Cliente> {
    return {
      nombre: (obj.nombre ?? '').toString().trim(),
      email: (obj.email ?? '').toString().trim(),
      telefono: (obj.telefono ?? '').toString().trim()
    };
  }

  private valida(p: Partial<Cliente>): boolean {
    if (!p.nombre || !p.email) {
      alert('Completá nombre y email.');
      return false;
    }
    return true;
  }
}