// src/app/components/clientes/clientes.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService, Cliente, PaginatedResponse } from '../../services/cliente.service';
import { SearchService } from '../../services/busquedaglobal';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css'],
})
export class ClientesComponent implements OnInit, OnDestroy {
  clientes: Cliente[] = [];
  filteredClientes: Cliente[] = [];
  selectedAction: 'listar' | 'crear' | 'editar' | 'eliminar' = 'listar';
  loading = false;
  
  // 🔥 Variables de paginación
  currentPage = 1;
  lastPage = 1;
  perPage = 15;
  total = 0;
  from = 0;
  to = 0;
  
  nuevoCliente: Partial<Cliente> = {};
  
  private searchSubscription!: Subscription;

  constructor(
    private clienteService: ClienteService,
    private searchService: SearchService
  ) {}

  ngOnInit() {
    this.obtenerClientes();
    
    this.searchService.setCurrentComponent('clientes');
    window.addEventListener('scroll', this.onScroll.bind(this));
    this.searchSubscription = this.searchService.searchTerm$.subscribe(term => {
      this.filterClientes(term);
    });
    
  }
  

  ngOnDestroy() {
    window.removeEventListener('scroll', this.onScroll.bind(this));

    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
    this.searchService.clearSearch();
  }

  obtenerClientes(page: number = 1) {
    if (this.loading || (page > this.lastPage && this.lastPage !== 0)) return;
    
    this.loading = true;

    this.clienteService.getClientes(page, this.perPage).subscribe({
      next: (response: PaginatedResponse<Cliente>) => {
        if (page === 1) {
          // Primera página - reemplazar
          this.clientes = response.data;
        } else {
          // Páginas siguientes - concatenar
          this.clientes = [...this.clientes, ...response.data];
        }
        
        this.filteredClientes = [...this.clientes];
        this.currentPage = response.current_page;
        this.lastPage = response.last_page;
        this.total = response.total;
        this.from = response.from;
        this.to = response.to;
        
        this.loading = false;
        this.searchService.setSearchData(this.clientes);
      },
      error: (err) => {
        console.error('Error al obtener clientes', err);
        this.loading = false;
      },
    });
  }

  onScroll() {
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
    if (nearBottom && this.currentPage < this.lastPage) {
      this.obtenerClientes(this.currentPage + 1);
    }
  }

  private filterClientes(searchTerm: string) {
    if (!searchTerm) {
      this.filteredClientes = [...this.clientes];
      return;
    }

    this.filteredClientes = this.searchService.search(this.clientes, searchTerm, 'clientes');
  }

  clearSearch() {
    this.searchService.clearSearch();
  }

  seleccionarAccion(accion: 'listar' | 'crear' | 'editar' | 'eliminar') {
    this.selectedAction = accion;
  }

  crearCliente() {
    if (!this.nuevoCliente.nombre || !this.nuevoCliente.email) {
      alert('Nombre y email son obligatorios');
      return;
    }

    this.clienteService.createCliente(this.nuevoCliente).subscribe({
      next: (nuevoCliente) => {
        this.nuevoCliente = {};
        // Agregar al inicio y recargar primera página para mantener consistencia
        this.clientes = [nuevoCliente, ...this.clientes];
        this.filteredClientes = [nuevoCliente, ...this.filteredClientes];
        this.selectedAction = 'listar';
        this.searchService.setSearchData(this.clientes);
      },
      error: (err) => {
        console.error('Error al crear cliente', err);
        alert(err.error?.error || 'Error al crear cliente');
      },
    });
  }

  eliminarCliente(id: number) {
    if (!confirm('¿Seguro que querés eliminar este cliente?')) return;

    this.clienteService.deleteCliente(id).subscribe({
      next: () => {
        this.clientes = this.clientes.filter((c) => c.id !== id);
        this.filteredClientes = this.filteredClientes.filter((c) => c.id !== id);
        this.searchService.setSearchData(this.clientes);
      },
      error: (err) => {
        console.error('Error al eliminar cliente', err);
      },
    });
  }

  // 🔥 Método para cambiar elementos por página
  cambiarItemsPorPagina(perPage: number) {
    this.perPage = perPage;
    this.currentPage = 1;
    this.obtenerClientes(1);
  }
}
