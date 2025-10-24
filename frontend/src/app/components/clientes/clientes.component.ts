import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService, Cliente } from '../../services/cliente.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css'],
})
export class ClientesComponent implements OnInit, OnDestroy {
  clientes: Cliente[] = [];
  selectedAction: 'listar' | 'crear' | 'editar' | 'eliminar' = 'listar';
  loading = false;
  page = 1;
  lastPage = false;
  nuevoCliente: Partial<Cliente> = {};

  constructor(private clienteService: ClienteService) {}

  ngOnInit() {
    this.obtenerClientes();
    window.addEventListener('scroll', this.onScroll.bind(this));
  }

  ngOnDestroy() {
    window.removeEventListener('scroll', this.onScroll.bind(this));
  }

  // 🔹 Obtener clientes del backend
  obtenerClientes() {
    if (this.loading || this.lastPage) return;
    this.loading = true;

    this.clienteService.getClientes().subscribe({
      next: (data) => {
        this.clientes = [...this.clientes, ...data];
        this.loading = false;
        // ⚠️ Si luego tu back tiene paginación, podés agregar lógica acá.
      },
      error: (err) => {
        console.error('Error al obtener clientes', err);
        this.loading = false;
      },
    });
  }

  onScroll() {
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
    if (nearBottom) this.obtenerClientes();
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
      next: () => {
        this.nuevoCliente = {};
        this.clientes = [];
        this.obtenerClientes();
        this.selectedAction = 'listar';
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
      },
      error: (err) => {
        console.error('Error al eliminar cliente', err);
      },
    });
  }
}
