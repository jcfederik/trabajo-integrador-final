import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PresupuestoService,
  Presupuesto,
  Paginated
} from '../../services/presupuesto.service';
import { SearchService } from '../../services/busquedaglobal';
import { ReparacionService, Reparacion } from '../../services/reparacion.service';
import { Subject, Subscription, catchError, of, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

type Accion = 'listar' | 'crear';

type PresupuestoForm = Omit<Presupuesto, 'fecha' | 'monto_total' | 'id'> & {
  id?: number;
  fecha: string;                         
  monto_total: number | string | null;
  reparacionBusqueda: string;
  reparacionSeleccionada?: Reparacion;
};

type PresupuestoEditForm = {
  id?: number;
  reparacion_id?: number;
  fecha?: string;
  monto_total?: number | string | null;
  aceptado?: boolean;
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
  
  // =============== ESTADO DEL COMPONENTE ===============
  selectedAction: Accion = 'listar';

  private itemsAll: Presupuesto[] = [];
  items: Presupuesto[] = [];
  page = 1;
  perPage = 10;
  lastPage = false;
  loading = false;

  searchSub!: Subscription;
  searchTerm = '';

  editingId: number | null = null;
  editBuffer: PresupuestoEditForm = { reparacionBusqueda: '' };

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

  mostrandoReparacionesEdit = false;
  buscandoReparacionesEdit = false;
  reparacionesSugeridasEdit: Reparacion[] = [];
  private busquedaReparacionEdit = new Subject<string>();

  private reparacionesCache = new Map<number, string>();

  constructor(
    private svc: PresupuestoService,
    private reparacionSvc: ReparacionService,
    public searchService: SearchService
  ) {}

  // =============== CICLO DE VIDA ===============
  ngOnInit(): void {
    this.cargar();
    window.addEventListener('scroll', this.onScroll, { passive: true });

    this.configurarBusquedaGlobal();
    this.configurarBusquedaReparaciones();
    this.configurarBusquedaReparacionesEdicion();

    setTimeout(() => {
      this.items = [...this.items];
    }, 1000);
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    this.busquedaReparacion.unsubscribe();
    this.busquedaReparacionEdit.unsubscribe();
    this.searchSub?.unsubscribe();
    this.searchService.clearSearch();
  }

  // =============== CONFIGURACIÓN DE BÚSQUEDAS ===============
  private configurarBusquedaGlobal(): void {
    this.searchService.setCurrentComponent('presupuestos');
    this.searchSub = this.searchService.searchTerm$.subscribe(term => {
      this.searchTerm = (term || '').trim();
      
      if (this.searchTerm) {
        this.applyFilter();
      } else {
        this.items = [...this.itemsAll];
      }
    });
  }

  private configurarBusquedaReparaciones(): void {
    this.busquedaReparacion.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(termino => {
      this.buscarReparaciones(termino);
    });
  }

  private configurarBusquedaReparacionesEdicion(): void {
    this.busquedaReparacionEdit.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(termino => {
      this.buscarReparacionesEdit(termino);
    });
  }

  // =============== BÚSQUEDA Y FILTRADO ===============
  private applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    if (!term) {
      this.items = [...this.itemsAll];
      return;
    }

    this.loading = true;
    
    this.svc.buscarGlobal(this.searchTerm).subscribe({
      next: (presupuestosEncontrados) => {
        this.items = presupuestosEncontrados;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error en búsqueda global:', error);
        const itemsWithReparacionInfo = this.itemsAll.map(presupuesto => ({
          ...presupuesto,
          reparacion_descripcion: this.getDescripcionReparacion(presupuesto.reparacion_id),
          estado_legible: presupuesto.aceptado ? 'aceptado' : 'pendiente'
        }));
        
        const filtered = this.searchService.search(itemsWithReparacionInfo, term, 'presupuestos');
        this.items = filtered as Presupuesto[];
        this.loading = false;
      }
    });
  }

  // =============== GESTIÓN DE REPARACIONES ===============
  onBuscarReparacion(termino: string): void {
    this.busquedaReparacion.next(termino);
  }

  onBuscarReparacionEdit(termino: string): void {
    this.busquedaReparacionEdit.next(termino);
  }

  private buscarReparaciones(termino: string): void {
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
        this.actualizarCacheReparaciones(reparaciones);
      },
      error: () => {
        this.buscandoReparaciones = false;
      }
    });
  }

  private buscarReparacionesEdit(termino: string): void {
    const terminoLimpio = termino || '';
    
    if (!terminoLimpio.trim()) {
      this.reparacionesSugeridasEdit = [];
      this.mostrandoReparacionesEdit = false;
      return;
    }

    this.buscandoReparacionesEdit = true;
    this.reparacionSvc.buscarReparaciones(terminoLimpio).subscribe({
      next: (reparaciones) => {
        this.reparacionesSugeridasEdit = reparaciones.slice(0, 10);
        this.mostrandoReparacionesEdit = true;
        this.buscandoReparacionesEdit = false;
        this.actualizarCacheReparaciones(reparaciones);
      },
      error: () => {
        this.buscandoReparacionesEdit = false;
      }
    });
  }

  private actualizarCacheReparaciones(reparaciones: Reparacion[]): void {
    reparaciones.forEach(reparacion => {
      if (reparacion.descripcion) {
        this.reparacionesCache.set(reparacion.id, reparacion.descripcion);
      }
    });
  }

  seleccionarReparacion(reparacion: Reparacion): void {
    this.nuevo.reparacionSeleccionada = reparacion;
    this.nuevo.reparacion_id = reparacion.id;
    this.nuevo.reparacionBusqueda = reparacion.descripcion || '';
    this.mostrandoReparaciones = false;
    
    if (reparacion.descripcion) {
      this.reparacionesCache.set(reparacion.id, reparacion.descripcion);
    }
  }

  seleccionarReparacionEdit(reparacion: Reparacion): void {
    this.editBuffer.reparacionSeleccionada = reparacion;
    this.editBuffer.reparacion_id = reparacion.id;
    this.editBuffer.reparacionBusqueda = reparacion.descripcion || '';
    this.mostrandoReparacionesEdit = false;
    
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

  limpiarReparacionEdit(): void {
    this.editBuffer.reparacionSeleccionada = undefined;
    this.editBuffer.reparacion_id = undefined;
    this.editBuffer.reparacionBusqueda = '';
    this.reparacionesSugeridasEdit = [];
    this.mostrandoReparacionesEdit = false;
  }

  ocultarReparaciones(): void {
    setTimeout(() => {
      this.mostrandoReparaciones = false;
    }, 200);
  }

  ocultarReparacionesEdit(): void {
    setTimeout(() => {
      this.mostrandoReparacionesEdit = false;
    }, 200);
  }

  getDescripcionReparacion(reparacionId: number): string {
    if (this.reparacionesCache.has(reparacionId)) {
      return this.reparacionesCache.get(reparacionId)!;
    }

    const descripcionTemporal = `Reparación #${reparacionId}`;
    this.reparacionesCache.set(reparacionId, descripcionTemporal);
    this.cargarReparacionIndividual(reparacionId);
    
    return descripcionTemporal;
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
        this.items = [...this.items];
      }
    });
  }

  private cargarTodasLasReparaciones(): Promise<void> {
    return new Promise((resolve) => {
      const reparacionesIds = [...new Set(this.itemsAll.map(p => p.reparacion_id))];
      const reparacionesFaltantes = reparacionesIds.filter(id => !this.reparacionesCache.has(id));
      
      if (reparacionesFaltantes.length === 0) {
        resolve();
        return;
      }

      reparacionesFaltantes.forEach(id => {
        this.reparacionesCache.set(id, `Cargando...`);
      });

      const requests = reparacionesFaltantes.map(id => 
        this.reparacionSvc.show(id).pipe(
          catchError(() => {
            this.reparacionesCache.set(id, `Reparación #${id}`);
            return of(null);
          })
        )
      );

      forkJoin(requests).subscribe(results => {
        results.forEach((reparacion, index) => {
          const id = reparacionesFaltantes[index];
          if (reparacion) {
            const descripcion = reparacion.descripcion || `Reparación #${id}`;
            this.reparacionesCache.set(id, descripcion);
          }
        });
        resolve();
      });
    });
  }

  // =============== CARGA DE DATOS ===============
  cargar(): void {
    if (this.loading || this.lastPage) return;
    this.loading = true;

    this.svc.list(this.page, this.perPage).subscribe({
      next: (res: Paginated<Presupuesto>) => {
        const batch = res.data ?? [];
        
        if (this.page === 1) {
          this.itemsAll = batch;
        } else {
          this.itemsAll = [...this.itemsAll, ...batch];
        }

        if (!this.searchTerm) {
          const itemsForSearch = this.itemsAll.map(p => ({
            ...p,
            reparacion_descripcion: this.getDescripcionReparacion(p.reparacion_id),
            estado_legible: p.aceptado ? 'aceptado' : 'pendiente'
          }));

          this.applyFilter();
          this.searchService.setSearchData(itemsForSearch);
        }

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
    this.itemsAll = [];
    this.items = [];
    this.page = 1;
    this.lastPage = false;
    this.searchTerm = ''; 
    this.searchService.clearSearch();
    this.cargar();
  }

  // =============== ACCIONES DEL USUARIO ===============
  seleccionarAccion(a: Accion): void { 
    this.selectedAction = a; 
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
        this.itemsAll = this.itemsAll.filter(i => i.id !== id);
        const itemsForSearch = this.itemsAll.map(p => ({
          ...p,
          reparacion_descripcion: this.getDescripcionReparacion(p.reparacion_id),
          estado_legible: p.aceptado ? 'aceptado' : 'pendiente'
        }));
        this.applyFilter();
        this.searchService.setSearchData(itemsForSearch);
      },
      error: (e) => {
        alert(e?.error?.error ?? 'No se pudo eliminar');
      }
    });
  }

  startEdit(item: Presupuesto): void {
    this.editingId = item.id;
    const descripcionReparacion = this.getDescripcionReparacion(item.reparacion_id);
    
    this.editBuffer = {
      id: item.id,
      reparacion_id: item.reparacion_id,
      fecha: (item.fecha ?? '').slice(0, 10),
      monto_total: item.monto_total,
      aceptado: item.aceptado,
      reparacionBusqueda: descripcionReparacion,
      reparacionSeleccionada: undefined
    };
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editBuffer = { reparacionBusqueda: '' };
  }

  saveEdit(id: number): void {
    const payload = this.limpiarEdit(this.editBuffer);
    if (!this.valida(payload)) return;

    payload.fecha = this.toISODate(payload.fecha as string);

    this.svc.update(id, payload).subscribe({
      next: () => {
        const updateLocal = (arr: Presupuesto[]) => {
          const idx = arr.findIndex(i => i.id === id);
          if (idx >= 0) {
            arr[idx] = { ...arr[idx], ...payload, fecha: payload.fecha! } as Presupuesto;
          }
        };
        
        updateLocal(this.itemsAll);
        updateLocal(this.items);
        
        const itemsForSearch = this.itemsAll.map(p => ({
          ...p,
          reparacion_descripcion: this.getDescripcionReparacion(p.reparacion_id),
          estado_legible: p.aceptado ? 'aceptado' : 'pendiente'
        }));
        this.searchService.setSearchData(itemsForSearch);
        this.cancelEdit();
      },
      error: (e) => {
        alert(e?.error?.error ?? 'Error al actualizar');
      }
    });
  }

  // =============== VALIDACIÓN Y UTILIDADES ===============
  private limpiar(obj: PresupuestoForm): Partial<Presupuesto> {
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

  private limpiarEdit(obj: PresupuestoEditForm): Partial<Presupuesto> {
    const reparacionId = obj.reparacion_id;

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