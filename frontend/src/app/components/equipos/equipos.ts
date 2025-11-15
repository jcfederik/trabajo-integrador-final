// src/app/components/equipos/equipos.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { EquipoService, Equipo, PaginatedResponse } from '../../services/equipos';
import { SearchService } from '../../services/busquedaglobal';

type Accion = 'listar' | 'crear';
type EquipoUI = Equipo; // Si tu backend expone más campos (marca, modelo, etc.), podés extender: Equipo & { marca?: string; ... }

@Component({
  selector: 'app-equipos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './equipos.html',
  styleUrls: ['./equipos.css'],
})
export class EquiposComponent implements OnInit, OnDestroy {
  selectedAction: Accion = 'listar';

  // dataset crudo + visible (filtrado)
  private equiposAll: EquipoUI[] = [];
  equipos: EquipoUI[] = [];

  // paginación + estado
  page = 1;
  perPage = 15;
  lastPage = false;
  loading = false;

  // edición inline
  editingId: number | null = null;
  editBuffer: Partial<EquipoUI> = {};

  // creación
  nuevo: Partial<EquipoUI> = {
    // ajustá según tu modelo, pero la descripción está en tu validación
    descripcion: ''
  };

  // búsqueda global
  private searchSub?: Subscription;
  searchTerm = '';

  constructor(
    private equipoService: EquipoService,
    private searchService: SearchService
  ) {}

  ngOnInit(): void {
    this.resetLista();

    // integrar con buscador global
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

  seleccionarAccion(a: Accion) { this.selectedAction = a; }

  // ====== LISTA / SCROLL ======
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

        // paginación
        this.page = res.current_page;
        this.lastPage = res.last_page === 0 || res.current_page >= res.last_page;

        // aplicar filtro visible
        this.applyFilter();

        // compartir dataset con buscador
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

  // Filtrado en cliente (match simple por cualquier campo stringificable)
  private applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    if (!term) {
      this.equipos = [...this.equiposAll];
      return;
    }

    // Si sólo tenés `descripcion`, con esto basta. Si hay más campos, se matchean igual.
    this.equipos = this.equiposAll.filter(e => {
      try {
        return JSON.stringify(e).toLowerCase().includes(term);
      } catch {
        const desc = (e as any)?.descripcion ?? '';
        return desc.toString().toLowerCase().includes(term);
      }
    });
  }

  // ====== CREAR ======
  crear(): void {
    const payload = this.limpiar(this.nuevo);
    if (!this.valida(payload)) return;

    this.equipoService.createEquipo(payload).subscribe({
      next: () => {
        // refresco consistente desde página 1
        this.selectedAction = 'listar';
        this.nuevo = { descripcion: '' };
        this.resetLista();
      },
      error: (e) => {
        console.error('Error al crear equipo', e);
        alert(e?.error?.error ?? 'Error al crear equipo');
      }
    });
  }

  // ====== ELIMINAR ======
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

  // ====== EDICIÓN INLINE ======
  startEdit(item: EquipoUI): void {
    this.editingId = item.id;
    this.editBuffer = {
      // ajustá campos editables según tu modelo:
      descripcion: (item as any)?.descripcion ?? ''
    };
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editBuffer = {};
  }

  saveEdit(id: number): void {
    const payload = this.limpiar(this.editBuffer);
    if (!this.valida(payload)) return;

    // Asegurate de tener updateEquipo en tu servicio
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

  // ====== Helpers ======
  private limpiar(obj: Partial<EquipoUI>): Partial<EquipoUI> {
    // Normalizá sólo lo que sabés que existe. Mínimo ‘descripcion’.
    const out: Partial<EquipoUI> = {};
    if ((obj as any).descripcion !== undefined) {
      (out as any).descripcion = ((obj as any).descripcion ?? '').toString().trim();
    }
    return out;
  }

  private valida(p: Partial<EquipoUI>): boolean {
    // Si tu backend exige más campos, agregalos acá
    if (!(p as any).descripcion) {
      alert('Completá la descripción.');
      return false;
    }
    return true;
  }
}
