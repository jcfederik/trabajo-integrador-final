// En src/app/components/clientes/clientes.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService, Cliente } from '../../services/cliente.service';
import { SearchService } from '../../services/busqueda/busquedaglobal';
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
  page = 1;
  lastPage = false;
  nuevoCliente: Partial<Cliente> = {};
  
  private searchSubscription!: Subscription;

  constructor(
    private clienteService: ClienteService,
    private searchService: SearchService
  ) {}

  ngOnInit() {
    this.obtenerClientes();
    
    this.searchService.setCurrentComponent('clientes');
    
    this.searchSubscription = this.searchService.searchTerm$.subscribe(term => {
      this.filterClientes(term);
    });
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
    this.searchService.clearSearch();
  }

  obtenerClientes() {
    if (this.loading || this.lastPage) return;
    this.loading = true;

    this.clienteService.getClientes().subscribe({
      next: (data) => {
        this.clientes = [...this.clientes, ...data];
        this.filteredClientes = [...this.clientes];
        this.loading = false;
        this.searchService.setSearchData(this.clientes);
      },
      error: (err) => {
        console.error('Error al obtener clientes', err);
        this.loading = false;
      },
    });
  }

  private filterClientes(searchTerm: string) {
    if (!searchTerm) {
      this.filteredClientes = [...this.clientes];
      return;
    }

    // Usar el método mejorado
    this.filteredClientes = this.searchService.search(this.clientes, searchTerm);
    
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
}