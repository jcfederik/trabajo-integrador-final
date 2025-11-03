import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PresupuestoService,
  Presupuesto,
  Paginated
} from '../../services/presupuesto.service';

type Accion = 'listar' | 'crear';

/** Tipo de formulario: compatible con <input> (strings) y con null */
type PresupuestoForm = Omit<Presupuesto, 'fecha' | 'monto_total'> & {
  fecha: string;                         // yyyy-MM-dd para <input type="date">
  monto_total: number | string | null;   // <input type="number"> entrega string
};

@Component({
  selector: 'app-presupuestos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './presupuestos.html',
  styleUrls: ['./presupuestos.css']
})
export class PresupuestosComponent implements OnInit, OnDestroy {
  selectedAction: Accion = 'listar';

  // listado + paginación
  items: Presupuesto[] = [];
  page = 1;
  perPage = 10;
  lastPage = false;
  loading = false;

  // edición inline
  editingId: number | null = null;
  editBuffer: Partial<PresupuestoForm> = {};

  // crear
  nuevo: Partial<PresupuestoForm> = {
    reparacion_id: undefined as any,
    fecha: new Date().toISOString().slice(0, 10), // yyyy-MM-dd
    monto_total: null,
    aceptado: false
  };

  constructor(private svc: PresupuestoService) {}

  ngOnInit(): void {
    this.cargar();
    window.addEventListener('scroll', this.onScroll, { passive: true });
  }
  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
  }

  seleccionarAccion(a: Accion) { this.selectedAction = a; }

  // ====== LISTA / SCROLL ======
  cargar(): void {
    if (this.loading || this.lastPage) return;
    this.loading = true;

    this.svc.list(this.page, this.perPage).subscribe({
      next: (res: Paginated<Presupuesto>) => {
        this.items = [...this.items, ...res.data];
        this.page++;
        this.lastPage = (res.next_page_url === null) || (this.page > res.last_page);
        this.loading = false;
      },
      error: (e) => { console.error('Error al obtener presupuestos', e); this.loading = false; }
    });
  }

  onScroll = () => {
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 120;
    if (nearBottom) this.cargar();
  };

  resetLista(): void {
    this.items = [];
    this.page = 1;
    this.lastPage = false;
    this.cargar();
  }

  // ====== CREAR ======
  crear(): void {
    const payload = this.limpiar(this.nuevo);
    if (!this.valida(payload)) return;

    // normaliza fecha a ISO (date-time) esperado por tu backend
    payload.fecha = this.toISODate(payload.fecha as string);

    this.svc.create(payload).subscribe({
      next: () => {
        this.resetLista();
        this.nuevo = {
          reparacion_id: undefined as any,
          fecha: new Date().toISOString().slice(0, 10),
          monto_total: null,
          aceptado: false
        };
        this.selectedAction = 'listar';
      },
      error: (e) => {
        console.error('Error al crear presupuesto', e);
        alert(e?.error?.error ?? 'Error al crear el presupuesto');
      }
    });
  }

  // ====== ELIMINAR ======
  eliminar(id: number): void {
    if (!confirm('¿Eliminar este presupuesto?')) return;
    this.svc.delete(id).subscribe({
      next: () => { this.items = this.items.filter(i => i.id !== id); },
      error: (e) => {
        console.error('Error al eliminar presupuesto', e);
        alert(e?.error?.error ?? 'No se pudo eliminar');
      }
    });
  }

  // ====== EDICIÓN INLINE ======
  startEdit(item: Presupuesto): void {
    this.editingId = item.id;
    this.editBuffer = {
      reparacion_id: item.reparacion_id,
      fecha: (item.fecha ?? '').slice(0, 10),
      monto_total: item.monto_total, // puede ser null
      aceptado: item.aceptado
    };
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editBuffer = {};
  }

  saveEdit(id: number): void {
    const payload = this.limpiar(this.editBuffer);
    if (!this.valida(payload)) return;

    payload.fecha = this.toISODate(payload.fecha as string);

    this.svc.update(id, payload).subscribe({
      next: () => {
        const idx = this.items.findIndex(i => i.id === id);
        if (idx >= 0) {
          this.items[idx] = { ...this.items[idx], ...payload, fecha: payload.fecha! } as Presupuesto;
        }
        this.cancelEdit();
      },
      error: (e) => {
        console.error('Error al actualizar presupuesto', e);
        alert(e?.error?.error ?? 'Error al actualizar');
      }
    });
  }

  // ====== Helpers ======
  private limpiar(obj: Partial<PresupuestoForm>): Partial<Presupuesto> {
    const reparacionId =
      typeof obj.reparacion_id === 'string'
        ? Number(obj.reparacion_id)
        : obj.reparacion_id;

    // parseo robusto del monto (puede venir string del input)
    let monto: number | null;
    if (obj.monto_total == null) {
      monto = null;
    } else if (typeof obj.monto_total === 'string') {
      const trimmed = obj.monto_total.trim();
      monto = trimmed === '' ? null : Number(trimmed.replace(',', '.'));
    } else {
      monto = obj.monto_total;
    }

    return {
      reparacion_id: reparacionId!,
      fecha: (obj.fecha ?? '').toString().slice(0, 10),
      monto_total: monto,
      aceptado: !!obj.aceptado
    };
  }

  private valida(p: Partial<Presupuesto>): boolean {
    // requeridos
    if (!p.reparacion_id || !p.fecha || p.monto_total == null || typeof p.aceptado !== 'boolean') {
      alert('Completá: reparación, fecha, monto_total y aceptado.');
      return false;
    }
    // tipos / rangos
    if (isNaN(Number(p.reparacion_id)) || Number(p.reparacion_id) <= 0) {
      alert('reparacion_id inválido.');
      return false;
    }
    if (typeof p.monto_total !== 'number' || isNaN(p.monto_total) || p.monto_total < 0) {
      alert('monto_total debe ser numérico y >= 0.');
      return false;
    }
    return true;
  }

  /** Convierte 'yyyy-MM-dd' a ISO (UTC) para evitar desfasajes por timezone */
  private toISODate(yyyyMMdd: string): string {
    if (!yyyyMMdd) return new Date().toISOString();
    return new Date(yyyyMMdd + 'T00:00:00Z').toISOString();
  }
}
