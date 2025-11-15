// src/app/components/clientes/clientes.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ClienteService, Cliente, PaginatedResponse } from '../../services/cliente.service';
import { SearchService } from '../../services/busquedaglobal';

type Accion = 'listar' | 'crear';
type ClienteUI = Cliente & { telefono?: string; direccion?: string };

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css'],
})
export class ClientesComponent implements OnInit, OnDestroy {
  selectedAction: Accion = 'listar';

  // Datos (mantenemos el crudo y el filtrado para mostrar)
  private clientesAll: ClienteUI[] = [];
  clientes: ClienteUI[] = [];

  // paginación + estado
  page = 1;
  perPage = 15;
  lastPage = false;
  loading = false;

  // edición inline
  editingId: number | null = null;
  editBuffer: Partial<ClienteUI> = {};

  // creación
  nuevo: Partial<ClienteUI> = {
    nombre: '',
    email: '',
    telefono: '',
    direccion: ''
  };

  // búsqueda global
  private searchSub?: Subscription;
  searchTerm = '';

  constructor(
    private clienteService: ClienteService,
    private searchService: SearchService
  ) {}

  ngOnInit(): void {
    this.resetLista();

    // integrar con el buscador global
    this.searchService.setCurrentComponent('clientes');
    this.searchSub = this.searchService.searchTerm$.subscribe(term => {
      this.searchTerm = (term || '').trim();
      this.applyFilter();
    });

    window.addEventListener('scroll', this.onScroll, { passive: true });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    this.searchSub?.unsubscribe();
    this.searchService.clearSearch();
  }

  seleccionarAccion(a: Accion) { this.selectedAction = a; }

  // ====== LISTA / SCROLL ======
  private fetch(page = 1): void {
    if (this.loading || this.lastPage) return;
    this.loading = true;

    // Nota: usamos la firma (page, perPage) del servicio existente
    this.clienteService.getClientes(page, this.perPage).subscribe({
      next: (res: PaginatedResponse<Cliente>) => {
        const batch = (res.data as ClienteUI[]) ?? [];
        if (page === 1) {
          this.clientesAll = batch;
        } else {
          this.clientesAll = [...this.clientesAll, ...batch];
        }

        // paginación
        this.page = res.current_page;
this.lastPage = res.current_page >= res.last_page;

        // aplicar filtro visible
        this.applyFilter();

        // compartir dataset al buscador (para autocompletar si hiciera falta)
        this.searchService.setSearchData(this.clientesAll);

        this.loading = false;
      },
      error: (e) => {
        console.error('Error al obtener clientes', e);
        this.loading = false;
      }
    });
  }

  cargar(): void { this.fetch(this.page === 0 ? 1 : this.page); }

  onScroll = () => {
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 120;
    if (nearBottom && !this.loading && !this.lastPage) {
      this.fetch(this.page + 1);
    }
  };

  resetLista(): void {
    this.page = 1;
    this.lastPage = false;
    this.clientesAll = [];
    this.clientes = [];
    this.fetch(1);
  }

  // Filtrado en cliente (nombre, email, teléfono, dirección)
  private applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    if (!term) {
      this.clientes = [...this.clientesAll];
      return;
    }

    this.clientes = this.clientesAll.filter(c => {
      const nombre = (c.nombre ?? '').toString().toLowerCase();
      const email = (c.email ?? '').toString().toLowerCase();
      const telefono = (c.telefono ?? '').toString().toLowerCase();
      const direccion = (c.direccion ?? '').toString().toLowerCase();
      return (
        nombre.includes(term) ||
        email.includes(term) ||
        telefono.includes(term) ||
        direccion.includes(term)
      );
    });
  }

  // ====== CREAR ======
  crear(): void {
    const payload = this.limpiar(this.nuevo);
    if (!this.valida(payload)) return;

    this.clienteService.createCliente(payload).subscribe({
      next: () => {
        // refresco consistente desde página 1
        this.selectedAction = 'listar';
        this.nuevo = { nombre: '', email: '', telefono: '', direccion: '' };
        this.resetLista();
      },
      error: (e) => {
        console.error('Error al crear cliente', e);
        alert(e?.error?.error ?? 'Error al crear cliente');
      }
    });
  }

  // ====== ELIMINAR ======
  eliminar(id: number): void {
    if (!confirm('¿Eliminar este cliente?')) return;

    this.clienteService.deleteCliente(id).subscribe({
      next: () => {
        this.clientesAll = this.clientesAll.filter(c => c.id !== id);
        this.applyFilter();
        this.searchService.setSearchData(this.clientesAll);
      },
      error: (e) => { console.error('Error al eliminar cliente', e); }
    });
  }

  // ====== EDICIÓN INLINE ======
  startEdit(item: ClienteUI): void {
    this.editingId = item.id;
    this.editBuffer = {
      nombre: item.nombre,
      email: item.email,
      telefono: item.telefono ?? '',
      direccion: item.direccion ?? ''
    };
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editBuffer = {};
  }

  saveEdit(id: number): void {
    const payload = this.limpiar(this.editBuffer);
    if (!this.valida(payload)) return;

    this.clienteService.updateCliente(id, payload).subscribe({
      next: () => {
        // actualizar en memoria (crudo y visible)
        const updateLocal = (arr: ClienteUI[]) => {
          const idx = arr.findIndex(c => c.id === id);
          if (idx >= 0) arr[idx] = { ...arr[idx], ...payload } as ClienteUI;
        };
        updateLocal(this.clientesAll);
        updateLocal(this.clientes);

        this.searchService.setSearchData(this.clientesAll);
        this.cancelEdit();
      },
      error: (e) => {
        console.error('Error al actualizar cliente', e);
        alert(e?.error?.error ?? 'No se pudo actualizar');
      }
    });
  }

  // ====== Helpers ======
  private limpiar(obj: Partial<ClienteUI>): Partial<ClienteUI> {
    return {
      nombre: (obj.nombre ?? '').toString().trim(),
      email: (obj.email ?? '').toString().trim(),
      telefono: obj.telefono ? obj.telefono.toString().trim() : '',
      direccion: obj.direccion ? obj.direccion.toString().trim() : ''
    };
  }

  private valida(p: Partial<ClienteUI>): boolean {
    if (!p.nombre || !p.email) {
      alert('Completá: nombre y email.');
      return false;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email);
    if (!emailOk) {
      alert('Email inválido.');
      return false;
    }
    return true;
    }
}
