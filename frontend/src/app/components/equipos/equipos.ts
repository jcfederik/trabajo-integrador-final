// src/app/components/equipos/equipos.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { EquipoService, Equipo, PaginatedResponse } from '../../services/equipos';
import { ClienteService } from '../../services/cliente.service';   // <--- IMPORTANTE
import { SearchService } from '../../services/busquedaglobal';

type Accion = 'listar' | 'crear';
type EquipoUI = Equipo;

@Component({
  selector: 'app-equipos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './equipos.html',
  styleUrls: ['./equipos.css'],
})
export class EquiposComponent implements OnInit, OnDestroy {

  selectedAction: Accion = 'listar';
  
  private equiposAll: EquipoUI[] = [];
  equipos: EquipoUI[] = [];

  clientes: any[] = [];   // <---- LISTA DE CLIENTES

  page = 1;
  perPage = 15;
  lastPage = false;
  loading = false;

  editingId: number | null = null;
  editBuffer: Partial<EquipoUI> = {
    descripcion: '',
    cliente_id: undefined
  };

  nuevo: Partial<EquipoUI> = {
    descripcion: '',
    cliente_id: undefined
  };

  private searchSub?: Subscription;
  searchTerm = '';

  constructor(
    private equipoService: EquipoService,
    private clienteService: ClienteService,        // <--- INYECTADO
    public searchService: SearchService
  ) {}

  ngOnInit(): void {
    this.resetLista();
    this.cargarClientes();                           // <--- SE CARGAN CLIENTES

    this.searchService.setCurrentComponent('equipos');
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

  // ============================
  // CARGAR CLIENTES
  // ============================
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

  // ============================
  // FETCH / LISTA
  // ============================
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

    this.equipos = this.equiposAll.filter(e => {
      try {
        return JSON.stringify(e).toLowerCase().includes(term);
      } catch {
        const desc = (e as any)?.descripcion ?? '';
        return desc.toString().toLowerCase().includes(term);
      }
    });
  }

  // ============================
  // CREAR
  // ============================
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

  // ============================
  // ELIMINAR
  // ============================
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

  // ============================
  // EDICIÓN INLINE
  // ============================
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

  // ============================
  // HELPERS
  // ============================
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
