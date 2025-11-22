import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, catchError, of, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import {
  PresupuestoService,
  Presupuesto,
  Paginated
} from '../../services/presupuesto.service';
import { SearchService } from '../../services/busquedaglobal';
import { ReparacionService, Reparacion } from '../../services/reparacion.service';
import { AlertService } from '../../services/alert.service';

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

  // cache
  private reparacionesInfoCache = new Map<number, Reparacion>();
  
  // =============== ESTADO DEL COMPONENTE ===============
  selectedAction: Accion = 'listar';

  private itemsAll: Presupuesto[] = [];
  items: Presupuesto[] = [];
  page = 1;
  perPage = 10;
  lastPage = false;
  loading = false;

  // =============== BÚSQUEDA GLOBAL ===============
  searchSub!: Subscription;
  searchTerm = '';
  mostrandoSugerencias = false;
  buscandoPresupuestos = false;
  public isServerSearch = false;
  private serverSearchPage = 1;
  private serverSearchLastPage = false;
  private busquedaPresupuesto = new Subject<string>();

  // =============== EDICIÓN ===============
  editingId: number | null = null;
  editBuffer: PresupuestoEditForm = { reparacionBusqueda: '' };

  // =============== CREACIÓN ===============
  nuevo: PresupuestoForm = {
    reparacion_id: undefined as any,
    fecha: new Date().toISOString().slice(0, 10),
    monto_total: null,
    aceptado: false,
    reparacionBusqueda: ''
  };

  // =============== BÚSQUEDA DE REPARACIONES ===============
  reparacionesSugeridas: Reparacion[] = [];
  mostrandoReparaciones = false;
  buscandoReparaciones = false;
  private busquedaReparacion = new Subject<string>();

  mostrandoReparacionesEdit = false;
  buscandoReparacionesEdit = false;
  reparacionesSugeridasEdit: Reparacion[] = [];
  private busquedaReparacionEdit = new Subject<string>();

  // =============== CACHE DE REPARACIONES ===============
  private reparacionesCache = new Map<number, string>();
  cargandoDescripciones = new Set<number>();

  constructor(
    private svc: PresupuestoService,
    private reparacionSvc: ReparacionService,
    public searchService: SearchService,
    private alertService: AlertService
  ) {}

  // =============== LIFECYCLE ===============
  ngOnInit(): void {
    this.cargar();
    window.addEventListener('scroll', this.onScroll, { passive: true });

    this.configurarBusquedaGlobal();
    this.configurarBusquedaPresupuestos();
    this.configurarBusquedaReparaciones();
    this.configurarBusquedaReparacionesEdicion();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    this.busquedaPresupuesto.unsubscribe();
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
        this.onBuscarPresupuestos(this.searchTerm);
      } else {
        this.resetBusqueda();
      }
    });
  }

  private configurarBusquedaPresupuestos(): void {
    this.busquedaPresupuesto.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(termino => {
      this.buscarEnServidor(termino);
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

  // =============== BÚSQUEDA GLOBAL DE PRESUPUESTOS ===============
  onBuscarPresupuestos(termino: string): void {
    const terminoLimpio = (termino || '').trim();
    
    if (!terminoLimpio) {
      this.resetBusqueda();
      return;
    }

    this.searchTerm = terminoLimpio;
    this.mostrandoSugerencias = true;
    this.buscandoPresupuestos = true;

    if (terminoLimpio.length <= 2) {
      this.applyFilterLocal();
      this.buscandoPresupuestos = false;
    } else {
      this.busquedaPresupuesto.next(terminoLimpio);
    }
  }

  private buscarEnServidor(termino: string): void {
    this.isServerSearch = true;
    this.serverSearchPage = 1;
    this.serverSearchLastPage = false;

    this.searchService.searchOnServer('presupuestos', termino, 1, this.perPage).subscribe({
      next: (response: any) => {
        const presupuestosEncontrados = response.data || response;
        
        this.itemsAll = Array.isArray(presupuestosEncontrados) ? presupuestosEncontrados : [];
        this.items = [...this.itemsAll];
        
        this.buscandoPresupuestos = false;
        this.mostrandoSugerencias = true;
        
        const itemsForSearch = this.itemsAll.map(p => ({
          ...p,
          reparacion_descripcion: this.getDescripcionReparacion(p.reparacion_id),
          estado_legible: p.aceptado ? 'aceptado' : 'pendiente'
        }));
        this.searchService.setSearchData(itemsForSearch);
      },
      error: (error) => {
        this.applyFilterLocal();
        this.buscandoPresupuestos = false;
      }
    });
  }

  private applyFilterLocal(): void {
    if (!this.searchTerm) {
      this.items = [...this.itemsAll];
      return;
    }

    const itemsWithReparacionInfo = this.itemsAll.map(presupuesto => ({
      ...presupuesto,
      reparacion_descripcion: this.getDescripcionReparacion(presupuesto.reparacion_id),
      estado_legible: presupuesto.aceptado ? 'aceptado' : 'pendiente'
    }));
    
    const filtered = this.searchService.search(itemsWithReparacionInfo, this.searchTerm, 'presupuestos');
    this.items = filtered as Presupuesto[];
  }

  private applyFilter(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.items = [...this.itemsAll];
      return;
    }

    if (this.isServerSearch) {
      this.applyFilterLocal();
    } else {
      this.items = [...this.itemsAll];
    }
  }

  cerrarMenuSugerencias(): void {
    this.mostrandoSugerencias = false;
  }

  ocultarSugerencias(): void {
    setTimeout(() => {
      this.mostrandoSugerencias = false;
    }, 200);
  }

  private resetBusqueda(): void {
    this.isServerSearch = false;
    this.serverSearchPage = 1;
    this.serverSearchLastPage = false;
    this.mostrandoSugerencias = false;
    this.buscandoPresupuestos = false;
    this.items = [...this.itemsAll];
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
      this.searchTerm = '';
      this.isServerSearch = false;
      this.searchService.setSearchTerm('');

      this.items = [...this.itemsAll];

      this.reparacionesSugeridas = [];
      this.mostrandoReparaciones = false;
      this.buscandoReparaciones = false;

      return;
    }

    this.buscandoReparaciones = true;
    
    this.reparacionSvc.buscarReparaciones(terminoLimpio).subscribe({
      next: (response: any | { data: any[] }) => {
        const reparaciones = response.data || response;
        this.reparacionesSugeridas = Array.isArray(reparaciones) ? reparaciones.slice(0, 10) : [];
        this.mostrandoReparaciones = true;
        this.buscandoReparaciones = false;
        this.actualizarCacheReparaciones(this.reparacionesSugeridas);
      },
      error: (error) => {
        this.buscandoReparaciones = false;
        this.reparacionesSugeridas = [];
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
      next: (response: any | { data: any[] }) => {
        const reparaciones = response.data || response;
        this.reparacionesSugeridasEdit = Array.isArray(reparaciones) ? reparaciones.slice(0, 10) : [];
        this.mostrandoReparacionesEdit = true;
        this.buscandoReparacionesEdit = false;
        this.actualizarCacheReparaciones(this.reparacionesSugeridasEdit);
      },
      error: (error) => {
        this.buscandoReparacionesEdit = false;
        this.reparacionesSugeridasEdit = [];
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
  
  // Guardar en caches
  this.reparacionesInfoCache.set(reparacion.id, reparacion);
  if (reparacion.descripcion) {
    this.reparacionesCache.set(reparacion.id, reparacion.descripcion);
  }

  // Si la reparación no tiene información completa, cargarla
  if (!reparacion.equipo || !reparacion.tecnico) {
    this.cargarInformacionCompletaReparacion(reparacion.id);
  }
}

private cargarInformacionCompletaReparacion(reparacionId: number): void {
  this.reparacionSvc.show(reparacionId).subscribe({
    next: (reparacionCompleta: Reparacion) => {
      // Actualizar la reparación seleccionada con información completa
      if (this.nuevo.reparacionSeleccionada?.id === reparacionId) {
        this.nuevo.reparacionSeleccionada = reparacionCompleta;
      }
      
      // Actualizar cache
      this.reparacionesInfoCache.set(reparacionId, reparacionCompleta);
      if (reparacionCompleta.descripcion) {
        this.reparacionesCache.set(reparacionId, reparacionCompleta.descripcion);
      }
    },
    error: (error) => {
      console.error(`Error cargando información completa de reparación ${reparacionId}:`, error);
    }
  });
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

  // =============== GESTIÓN DE DESCRIPCIONES DE REPARACIONES ===============
  getDescripcionReparacion(reparacionId: number): string {
    if (this.reparacionesCache.has(reparacionId)) {
      return this.reparacionesCache.get(reparacionId)!;
    }

    this.cargandoDescripciones.add(reparacionId);
    
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
        this.cargandoDescripciones.delete(reparacionId);
        this.items = [...this.items];
      },
      error: () => {
        this.reparacionesCache.set(reparacionId, `Reparación #${reparacionId}`);
        this.cargandoDescripciones.delete(reparacionId);
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
        this.cargandoDescripciones.add(id);
        this.reparacionesCache.set(id, `Cargando...`);
      });

      const requests = reparacionesFaltantes.map(id => 
        this.reparacionSvc.show(id).pipe(
          catchError(() => {
            this.reparacionesCache.set(id, `Reparación #${id}`);
            this.cargandoDescripciones.delete(id);
            return of(null);
          })
        )
      );

      forkJoin(requests).subscribe(results => {
        results.forEach((reparacion, index) => {
          const id = reparacionesFaltantes[index];
          this.cargandoDescripciones.delete(id);
          if (reparacion) {
            const descripcion = reparacion.descripcion || `Reparación #${id}`;
            this.reparacionesCache.set(id, descripcion);
          }
        });
        this.items = [...this.items];
        resolve();
      });
    });
  }

  // =============== CARGA DE DATOS ===============
cargar(): void {
  if (this.loading || this.lastPage) return;
  this.loading = true;

  // Intentar con el endpoint optimizado, si falla usar el normal
  this.svc.listOptimizado(this.page, this.perPage, this.searchTerm).pipe(
    catchError((error) => {
      console.warn('Endpoint optimizado falló, usando endpoint normal', error);
      return this.svc.list(this.page, this.perPage);
    })
  ).subscribe({
    next: (res: Paginated<Presupuesto>) => {
      const batch = res.data ?? [];
      
      // Procesar batch
      const batchProcesado = batch.map(presupuesto => {
        if (presupuesto.reparacion) {
          this.reparacionesInfoCache.set(presupuesto.reparacion_id, presupuesto.reparacion);
          if (presupuesto.reparacion.descripcion) {
            this.reparacionesCache.set(presupuesto.reparacion_id, presupuesto.reparacion.descripcion);
          }
        }
        
        return {
          ...presupuesto,
          reparacion_descripcion: presupuesto.reparacion?.descripcion || `Reparación #${presupuesto.reparacion_id}`,
          estado_legible: presupuesto.aceptado ? 'aceptado' : 'pendiente'
        };
      });
      
      if (this.page === 1) {
        this.itemsAll = batchProcesado;
      } else {
        this.itemsAll = [...this.itemsAll, ...batchProcesado];
      }

      this.applyFilter();
      
      const itemsForSearch = this.itemsAll.map(p => ({
        ...p,
        reparacion_descripcion: p.reparacion?.descripcion || `Reparación #${p.reparacion_id}`,
        estado_legible: p.aceptado ? 'aceptado' : 'pendiente'
      }));
      this.searchService.setSearchData(itemsForSearch);

      this.page++;
      this.lastPage = (res.next_page_url === null) || (this.page > res.last_page);
      this.loading = false;
    },
    error: (error) => { 
      console.error('Error cargando presupuestos:', error);
      this.loading = false; 
      this.alertService.showGenericError('Error al cargar los presupuestos');
    }
  });
}

  onScroll = () => {
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 120;
    
    if (nearBottom) {
      if (this.isServerSearch && this.searchTerm && !this.serverSearchLastPage) {
        this.cargarMasResultadosBusqueda();
      } else if (!this.searchTerm) {
        this.cargar();
      }
    }
  };

  private cargarMasResultadosBusqueda(): void {
    if (this.loading || this.serverSearchLastPage) return;
    
    this.loading = true;
    this.serverSearchPage++;

    this.searchService.searchOnServer('presupuestos', this.searchTerm, this.serverSearchPage, this.perPage).subscribe({
      next: (response: any) => {
        const nuevosPresupuestos = response.data || response;
        
        if (Array.isArray(nuevosPresupuestos) && nuevosPresupuestos.length > 0) {
          this.itemsAll = [...this.itemsAll, ...nuevosPresupuestos];
          this.items = [...this.itemsAll];
          
          const itemsForSearch = this.itemsAll.map(p => ({
            ...p,
            reparacion_descripcion: this.getDescripcionReparacion(p.reparacion_id),
            estado_legible: p.aceptado ? 'aceptado' : 'pendiente'
          }));
          this.searchService.setSearchData(itemsForSearch);
        } else {
          this.serverSearchLastPage = true;
        }
        
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.serverSearchLastPage = true;
      }
    });
  }

  resetLista(): void {
    this.itemsAll = [];
    this.items = [];
    this.page = 1;
    this.lastPage = false;
    this.searchTerm = ''; 
    this.isServerSearch = false;
    this.serverSearchPage = 1;
    this.serverSearchLastPage = false;
    this.mostrandoSugerencias = false;
    this.searchService.clearSearch();
    this.cargar();
  }

  // =============== ACCIONES DEL USUARIO ===============
  seleccionarAccion(a: Accion): void { 
    this.selectedAction = a; 
  }

  async crear(): Promise<void> {
    const payload = this.limpiar(this.nuevo);
    if (!this.valida(payload)) return;

    payload.fecha = this.toISODate(payload.fecha as string);

    this.alertService.showLoading('Creando presupuesto...');

    this.svc.create(payload).subscribe({
      next: () => {
        this.alertService.closeLoading();
        this.resetLista();
        this.nuevo = {
          reparacion_id: undefined as any,
          fecha: new Date().toISOString().slice(0, 10),
          monto_total: null,
          aceptado: false,
          reparacionBusqueda: ''
        };
        this.selectedAction = 'listar';
        this.alertService.showPresupuestoCreado();
      },
      error: (e) => {
        this.alertService.closeLoading();
        this.alertService.showGenericError('Error al crear el presupuesto');
      }
    });
  }

  async eliminar(id: number): Promise<void> {
    const confirmed = await this.alertService.confirmDeletePresupuesto(id);
    if (!confirmed) return;

    this.alertService.showLoading('Eliminando presupuesto...');

    this.svc.delete(id).subscribe({
      next: () => { 
        this.alertService.closeLoading();
        this.itemsAll = this.itemsAll.filter(i => i.id !== id);
        const itemsForSearch = this.itemsAll.map(p => ({
          ...p,
          reparacion_descripcion: this.getDescripcionReparacion(p.reparacion_id),
          estado_legible: p.aceptado ? 'aceptado' : 'pendiente'
        }));
        this.applyFilter();
        this.searchService.setSearchData(itemsForSearch);
        this.alertService.showPresupuestoEliminado();
      },
      error: (e) => {
        this.alertService.closeLoading();
        this.alertService.showGenericError('No se pudo eliminar el presupuesto');
      }
    });
  }

  // =============== EDICIÓN ===============
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

  async saveEdit(id: number): Promise<void> {
    const payload = this.limpiarEdit(this.editBuffer);
    if (!this.valida(payload)) return;

    payload.fecha = this.toISODate(payload.fecha as string);

    this.alertService.showLoading('Actualizando presupuesto...');

    this.svc.update(id, payload).subscribe({
      next: () => {
        this.alertService.closeLoading();
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
        this.alertService.showPresupuestoActualizado();
      },
      error: (e) => {
        this.alertService.closeLoading();
        this.alertService.showGenericError('Error al actualizar el presupuesto');
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
      this.alertService.showGenericError('Completá: reparación, fecha, monto_total y aceptado.');
      return false;
    }
    
    if (isNaN(Number(p.reparacion_id)) || Number(p.reparacion_id) <= 0) {
      this.alertService.showGenericError('reparacion_id inválido.');
      return false;
    }
    
    if (typeof p.monto_total !== 'number' || isNaN(p.monto_total) || p.monto_total < 0) {
      this.alertService.showGenericError('monto_total debe ser numérico y >= 0.');
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

getTituloPresupuesto(presupuesto: Presupuesto): string {
  if (presupuesto.reparacion) {
    const cliente = presupuesto.reparacion.cliente_nombre || 'Cliente';
    const equipo = presupuesto.reparacion.equipo_nombre || 'Equipo';
    return `Presupuesto #${presupuesto.id} - ${cliente} | ${equipo}`;
  }
  
  const reparacionInfo = this.reparacionesInfoCache.get(presupuesto.reparacion_id);
  if (reparacionInfo) {
    const cliente = reparacionInfo.cliente_nombre || 'Cliente';
    const equipo = reparacionInfo.equipo_nombre || 'Equipo';
    return `Presupuesto #${presupuesto.id} - ${cliente} | ${equipo}`;
  }
  
  return `Presupuesto #${presupuesto.id}`;
}

getInfoEquipo(reparacionId: number): string {
  const reparacionInfo = this.reparacionesInfoCache.get(reparacionId);
  return reparacionInfo?.equipo_nombre || '';
}

getInfoTecnico(reparacionId: number): string {
  const reparacionInfo = this.reparacionesInfoCache.get(reparacionId);
  return reparacionInfo?.tecnico_nombre || '';
}

getInfoCliente(reparacionId: number): string {
  const reparacionInfo = this.reparacionesInfoCache.get(reparacionId);
  return reparacionInfo?.cliente_nombre || '';
}


}