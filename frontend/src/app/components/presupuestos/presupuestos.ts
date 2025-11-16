import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PresupuestoService,
  Presupuesto,
  Paginated
} from '../../services/presupuesto.service';
import { ReparacionService, Reparacion } from '../../services/reparacion.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

type Accion = 'listar' | 'crear';

type PresupuestoForm = Omit<Presupuesto, 'fecha' | 'monto_total' | 'id'> & {
  id?: number;
  fecha: string;                         
  monto_total: number | string | null;
  reparacionBusqueda: string;
  reparacionSeleccionada?: Reparacion;
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

  items: Presupuesto[] = [];
  page = 1;
  perPage = 10;
  lastPage = false;
  loading = false;

  editingId: number | null = null;
  editBuffer: Partial<PresupuestoForm> = {};

  nuevo: PresupuestoForm = {
    reparacion_id: undefined as any,
    fecha: new Date().toISOString().slice(0, 10),
    monto_total: null,
    aceptado: false,
    reparacionBusqueda: ''
  };

  reparacionesSugeridas: Reparacion[] = [];
  mostrandoReparaciones = false;
  buscandoReparaciones = false;
  private busquedaReparacion = new Subject<string>();
  private reparacionesCache = new Map<number, string>();

  constructor(
    private svc: PresupuestoService,
    private reparacionSvc: ReparacionService
  ) {}

  ngOnInit(): void {
    this.cargar();
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.busquedaReparacion.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(termino => {
      this.buscarReparaciones(termino);
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    this.busquedaReparacion.unsubscribe();
  }

  seleccionarAccion(a: Accion) { 
    this.selectedAction = a; 
  }

  onBuscarReparacion(termino: string): void {
    this.busquedaReparacion.next(termino);
  }

  buscarReparaciones(termino: string): void {
    const terminoLimpio = termino || '';
    
    if (!terminoLimpio.trim()) {
      this.reparacionesSugeridas = [];
      this.mostrandoReparaciones = false;
      return;
    }

    this.buscandoReparaciones = true;
    this.reparacionSvc.buscarReparaciones(terminoLimpio).subscribe({
      next: (reparaciones) => {
        this.reparacionesSugeridas = reparaciones.slice(0, 10);
        this.mostrandoReparaciones = true;
        this.buscandoReparaciones = false;
        
        reparaciones.forEach(reparacion => {
          if (reparacion.descripcion) {
            this.reparacionesCache.set(reparacion.id, reparacion.descripcion);
          }
        });
      },
      error: () => {
        this.buscandoReparaciones = false;
      }
    });
  }

  seleccionarReparacion(reparacion: Reparacion): void {
    this.nuevo.reparacionSeleccionada = reparacion;
    this.nuevo.reparacion_id = reparacion.id;
    this.nuevo.reparacionBusqueda = reparacion.displayText || reparacion.descripcion;
    this.mostrandoReparaciones = false;
    
    if (reparacion.descripcion) {
      this.reparacionesCache.set(reparacion.id, reparacion.descripcion);
    }
  }

  limpiarReparacion(): void {
    this.nuevo.reparacionSeleccionada = undefined;
    this.nuevo.reparacion_id = undefined as any;
    this.nuevo.reparacionBusqueda = '';
    this.reparacionesSugeridas = [];
    this.mostrandoReparaciones = false;
  }

  ocultarReparaciones(): void {
    setTimeout(() => {
      this.mostrandoReparaciones = false;
    }, 200);
  }

  getDescripcionReparacion(reparacionId: number): string {
    if (this.reparacionesCache.has(reparacionId)) {
      return this.reparacionesCache.get(reparacionId) || `Reparación #${reparacionId}`;
    }

    const reparacionEnSugerencias = this.reparacionesSugeridas.find(r => r.id === reparacionId);
    if (reparacionEnSugerencias?.descripcion) {
      this.reparacionesCache.set(reparacionId, reparacionEnSugerencias.descripcion);
      return reparacionEnSugerencias.descripcion;
    }

    this.cargarReparacionIndividual(reparacionId);
    
    return `Reparación #${reparacionId}`;
  }

  private cargarReparacionIndividual(reparacionId: number): void {
    this.reparacionSvc.show(reparacionId).subscribe({
      next: (reparacion) => {
        const descripcion = reparacion.descripcion || `Reparación #${reparacionId}`;
        this.reparacionesCache.set(reparacionId, descripcion);
        this.items = [...this.items];
      },
      error: () => {
        this.reparacionesCache.set(reparacionId, `Reparación #${reparacionId}`);
      }
    });
  }

  private cargarTodasLasReparaciones(): void {
    const reparacionesIds = [...new Set(this.items.map(p => p.reparacion_id))];
    
    reparacionesIds.forEach(reparacionId => {
      if (!this.reparacionesCache.has(reparacionId)) {
        this.cargarReparacionIndividual(reparacionId);
      }
    });
  }

  cargar(): void {
    if (this.loading || this.lastPage) return;
    this.loading = true;

    this.svc.list(this.page, this.perPage).subscribe({
      next: (res: Paginated<Presupuesto>) => {
        this.items = [...this.items, ...res.data];
        this.page++;
        this.lastPage = (res.next_page_url === null) || (this.page > res.last_page);
        this.loading = false;
        
        this.cargarTodasLasReparaciones();
      },
      error: () => { 
        this.loading = false; 
      }
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

  crear(): void {
    const payload = this.limpiar(this.nuevo);
    if (!this.valida(payload)) return;

    payload.fecha = this.toISODate(payload.fecha as string);

    this.svc.create(payload).subscribe({
      next: () => {
        this.resetLista();
        this.nuevo = {
          reparacion_id: undefined as any,
          fecha: new Date().toISOString().slice(0, 10),
          monto_total: null,
          aceptado: false,
          reparacionBusqueda: ''
        };
        this.selectedAction = 'listar';
      },
      error: (e) => {
        alert(e?.error?.error ?? 'Error al crear el presupuesto');
      }
    });
  }

  eliminar(id: number): void {
    if (!confirm('¿Eliminar este presupuesto?')) return;
    this.svc.delete(id).subscribe({
      next: () => { 
        this.items = this.items.filter(i => i.id !== id); 
      },
      error: (e) => {
        alert(e?.error?.error ?? 'No se pudo eliminar');
      }
    });
  }

  startEdit(item: Presupuesto): void {
    this.editingId = item.id;
    this.editBuffer = {
      id: item.id,
      reparacion_id: item.reparacion_id,
      fecha: (item.fecha ?? '').slice(0, 10),
      monto_total: item.monto_total,
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
        alert(e?.error?.error ?? 'Error al actualizar');
      }
    });
  }

  private limpiar(obj: Partial<PresupuestoForm>): Partial<Presupuesto> {
    const reparacionId = typeof obj.reparacion_id === 'string'
      ? Number(obj.reparacion_id)
      : obj.reparacion_id;

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
    if (!p.reparacion_id || !p.fecha || p.monto_total == null || typeof p.aceptado !== 'boolean') {
      alert('Completá: reparación, fecha, monto_total y aceptado.');
      return false;
    }
    
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

  getEstadoBadgeClass(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'pendiente':
        return 'bg-warning text-dark';
      case 'en proceso':
        return 'bg-info text-white';
      case 'finalizada':
        return 'bg-success text-white';
      case 'cancelada':
        return 'bg-danger text-white';
      default:
        return 'bg-secondary text-white';
    }
  }

  private toISODate(yyyyMMdd: string): string {
    if (!yyyyMMdd) return new Date().toISOString();
    return new Date(yyyyMMdd + 'T00:00:00Z').toISOString();
  }
}