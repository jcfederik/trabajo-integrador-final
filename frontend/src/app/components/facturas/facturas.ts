import { Component, OnInit, OnDestroy, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, forkJoin, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, catchError, map, switchMap } from 'rxjs/operators';

import { FacturaService, Factura, Paginated } from '../../services/facturas';
import { PresupuestoService, Presupuesto } from '../../services/presupuesto.service';
import { ReparacionService, Reparacion } from '../../services/reparacion.service';
import { SearchService } from '../../services/busquedaglobal';
import { FacturaReportComponent } from '../factura-report/factura-report';
import { ExportModalComponent } from '../export-modal/export-modal';
import { ClienteService } from '../../services/cliente.service';
import { AlertService } from '../../services/alert.service';
import { CobrosModalComponent } from '../cobros-modal/cobros-modal.component';
import { PresupuestoPickerComponent } from '../presupuesto-picker/presupuesto-picker';

type Accion = 'listar' | 'crear';

type FacturaForm = Omit<Factura, 'fecha' | 'monto_total' | 'id'> & {
  id?: number;
  fecha: string;
  monto_total: number | string | null;
  presupuestoBusqueda: string;
  presupuestoSeleccionado?: PresupuestoConReparacion; // Presupuesto con información de reparación
};

interface PresupuestoConReparacion extends Presupuesto {
  reparacion?: Reparacion;
}

@Component({
  selector: 'app-facturas',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ExportModalComponent,
    CobrosModalComponent,
    PresupuestoPickerComponent
  ],
  templateUrl: './facturas.html',
  styleUrls: ['./facturas.css']
})
export class FacturasComponent implements OnInit, OnDestroy {

  private facService = inject(FacturaService);
  private presupuestoService = inject(PresupuestoService);
  private reparacionService = inject(ReparacionService);
  private searchService = inject(SearchService);
  private clienteService = inject(ClienteService);
  private alertService = inject(AlertService);

  selectedAction: Accion = 'listar';
  mostrarModalExportacion = false;

  private facturasAll: Factura[] = [];
  facturas: Factura[] = [];
  page = 1;
  perPage = 10;
  lastPage = false;
  loading = false;

  private searchSub?: Subscription;
  searchTerm = '';
  private isServerSearch = false;
  private serverSearchPage = 1;
  private serverSearchLastPage = false;

  editingId: number | null = null;
  
  editBuffer: FacturaForm = {
    presupuesto_id: undefined as any,
    numero: '',
    letra: 'A',
    fecha: new Date().toISOString().slice(0, 10),
    monto_total: null,
    detalle: '',
    presupuestoBusqueda: ''
  };
  
  nuevo: FacturaForm = {
    presupuesto_id: undefined as any,
    numero: '',
    letra: 'A',
    fecha: new Date().toISOString().slice(0, 10),
    monto_total: null,
    detalle: '',
    presupuestoBusqueda: ''
  };

  presupuestosSugeridos: PresupuestoConReparacion[] = [];
  mostrandoPresupuestos = false;
  buscandoPresupuestos = false;
  private busquedaPresupuesto = new Subject<string>();
  
  // Cache para información de reparaciones y presupuestos
  private reparacionesCache = new Map<number, Reparacion>();
  private presupuestosCache = new Map<number, PresupuestoConReparacion>();

  mostrarCobros: { [key: number]: boolean } = {};

  @ViewChild(CobrosModalComponent) cobrosModal!: CobrosModalComponent;

  ngOnInit(): void {
    this.cargar();
    window.addEventListener('scroll', this.onScroll, { passive: true });
    
    this.configurarBusquedaPresupuestos();
    this.configurarBusquedaGlobal();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    this.busquedaPresupuesto.unsubscribe();
    this.searchSub?.unsubscribe();
    this.searchService.clearSearch();
  }

  private configurarBusquedaPresupuestos(): void {
    this.busquedaPresupuesto.pipe(
      debounceTime(50),
      distinctUntilChanged()
    ).subscribe(termino => {
      this.buscarPresupuestos(termino);
    });
  }

  private configurarBusquedaGlobal(): void {
    this.searchService.setCurrentComponent('facturas');
    this.searchSub = this.searchService.searchTerm$.subscribe(term => {
      this.searchTerm = (term || '').trim();
      this.applyFilter();
    });
  }

  seleccionarAccion(a: Accion): void { 
    this.selectedAction = a; 
  }

  abrirModalExportacion(): void {
    this.mostrarModalExportacion = true;
  }

  cerrarModalExportacion(): void {
    this.mostrarModalExportacion = false;
  }

  toggleCobros(facturaId: number): void {
    this.mostrarCobros[facturaId] = !this.mostrarCobros[facturaId];
  }

  abrirModalCobros(factura: Factura): void {
    console.log('🔍 Datos de factura al abrir modal:', {
      id: factura.id,
      numero: factura.numero,
      monto_total: factura.monto_total
    });

    // ✅ VERIFICAR QUE LA FACTURA TENGA ID VÁLIDO
    if (!factura.id || factura.id <= 0) {
      this.alertService.showError('Error', 'La factura no tiene un ID válido');
      return;
    }

    if (!this.cobrosModal) {
      this.alertService.showGenericError('Error al abrir el modal de pagos');
      return;
    }

    this.cobrosModal.abrirModal(
      factura.id,
      `${factura.numero}${factura.letra ? ' (' + factura.letra + ')' : ''}`,
      factura.monto_total || 0
    );
  }

  cerrarModalCobros(): void {
    // El cierre se maneja automáticamente en el modal
  }

  cargar(): void {
    if (this.loading || this.lastPage) return;
    this.loading = true;

    this.facService.list(this.page, this.perPage).subscribe({
      next: (res: Paginated<Factura>) => {
        const nuevasFacturas = [...this.facturasAll, ...res.data];
        this.facturasAll = nuevasFacturas;
        
        this.applyFilter();
        this.page++;
        this.lastPage = res.next_page_url === null || this.page > res.last_page;
        this.loading = false;

        this.searchService.setSearchData(this.facturasAll);
        
        // Cargar información de presupuestos y reparaciones asociadas a facturas
        this.cargarInformacionPresupuestos(nuevasFacturas);
      },
      error: () => { 
        this.loading = false; 
        this.alertService.showGenericError('Error al cargar las facturas');
      }
    });
  }

  private cargarInformacionPresupuestos(facturas: Factura[]): void {
    const presupuestosIds = [...new Set(facturas.map(f => f.presupuesto_id))];
    
    presupuestosIds.forEach(presupuestoId => {
      if (!this.presupuestosCache.has(presupuestoId)) {
        this.cargarPresupuestoCompleto(presupuestoId);
      }
    });
  }

  private cargarPresupuestoCompleto(presupuestoId: number): void {
    this.presupuestoService.show(presupuestoId).pipe(
      switchMap((presupuesto: Presupuesto) => {
        // Guardar el presupuesto en cache
        const presupuestoConReparacion: PresupuestoConReparacion = {
          ...presupuesto,
          reparacion: presupuesto.reparacion
        };
        this.presupuestosCache.set(presupuestoId, presupuestoConReparacion);
        
        // Si tiene reparación, guardarla también en cache
        if (presupuesto.reparacion) {
          this.reparacionesCache.set(presupuesto.reparacion_id, presupuesto.reparacion);
        }
        
        return of(presupuestoConReparacion);
      }),
      catchError(() => {
        console.warn(`No se pudo cargar presupuesto ${presupuestoId}`);
        return of(null);
      })
    ).subscribe();
  }

  resetLista(): void {
    this.facturasAll = [];
    this.facturas = [];
    this.page = 1;
    this.lastPage = false;
    this.serverSearchPage = 1;
    this.serverSearchLastPage = false;
    this.isServerSearch = false;
    
    if (this.searchTerm) {
      this.applyFilter();
    } else {
      this.cargar();
    }
  }

  onScroll = (): void => {
    if (this.loading) return;
    
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 120;
    
    if (nearBottom) {
      if (this.isServerSearch && !this.serverSearchLastPage) {
        this.buscarEnServidor(this.searchTerm);
      } else if (!this.isServerSearch && !this.lastPage) {
        this.cargar();
      }
    }
  };

  private applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    
    if (!term) {
      this.facturas = [...this.facturasAll];
      this.isServerSearch = false;
      this.serverSearchPage = 1;
      this.serverSearchLastPage = false;
      return;
    }

    if (term.length > 2) {
      this.buscarEnServidor(term);
    } else {
      this.isServerSearch = false;
      this.facturas = this.searchService.search(this.facturasAll, term, 'facturas');
    }
  }

  private buscarEnServidor(termino: string): void {
    if (this.loading) return;
    
    this.isServerSearch = true;
    this.loading = true;

    this.searchService.searchOnServer('facturas', termino, this.serverSearchPage, this.perPage).subscribe({
      next: (res: any) => {
        if (this.serverSearchPage === 1) {
          this.facturasAll = res.data || [];
        } else {
          this.facturasAll = [...this.facturasAll, ...(res.data || [])];
        }
        
        this.facturas = [...this.facturasAll];
        this.serverSearchPage++;
        this.serverSearchLastPage = res.next_page_url === null;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.isServerSearch = false;
        this.facturas = this.searchService.search(this.facturasAll, termino, 'facturas');
      }
    });
  }

  onBuscarPresupuesto(termino: string, esEdicion: boolean = false): void {
    if (termino.length > 0) {
      this.mostrandoPresupuestos = true;
      this.busquedaPresupuesto.next(termino);
    } else {
      this.presupuestosSugeridos = [];
      this.mostrandoPresupuestos = false;
    }
  }

  private buscarPresupuestos(termino: string): void {
    const terminoLimpio = termino.trim();
    
    if (!terminoLimpio) {
      this.presupuestosSugeridos = [];
      this.mostrandoPresupuestos = false;
      return;
    }

    this.buscandoPresupuestos = true;
    
    this.presupuestoService.buscarPresupuestos(terminoLimpio).pipe(
      map((presupuestos: Presupuesto[]) => {
        return this.filtrarPresupuestosFacturables(presupuestos);
      }),
      switchMap((presupuestosFiltrados: Presupuesto[]) => {
        // Para cada presupuesto, cargar información de reparación si no la tiene
        if (presupuestosFiltrados.length === 0) {
          return of([]);
        }
        
        const requests = presupuestosFiltrados.map(presupuesto => 
          this.cargarInformacionReparacionParaPresupuesto(presupuesto)
        );
        
        return forkJoin(requests);
      })
    ).subscribe({
      next: (presupuestosCompletos: PresupuestoConReparacion[]) => {
        this.presupuestosSugeridos = presupuestosCompletos.slice(0, 10);
        this.mostrandoPresupuestos = true;
        this.buscandoPresupuestos = false;
      },
      error: () => {
        this.buscandoPresupuestos = false;
        this.presupuestosSugeridos = [];
        this.mostrandoPresupuestos = true;
      }
    });
  }

  private filtrarPresupuestosFacturables(presupuestos: Presupuesto[]): Presupuesto[] {
    return presupuestos.filter(presupuesto => {
        if (!presupuesto.aceptado) {
            return false;
        }
        
        const reparacionCache = this.reparacionesCache.get(presupuesto.reparacion_id);
        if (reparacionCache) {
            return reparacionCache.estado?.toLowerCase() === 'finalizado';
        }
        
        return true;
    });
  }

  private cargarInformacionReparacionParaPresupuesto(presupuesto: Presupuesto): Promise<PresupuestoConReparacion> {
    return new Promise((resolve) => {
      // Si ya tiene información de reparación, usarla
      if (presupuesto.reparacion) {
        resolve({
          ...presupuesto,
          reparacion: presupuesto.reparacion
        });
        return;
      }
      
      // Si no, cargarla
      this.reparacionService.show(presupuesto.reparacion_id).subscribe({
        next: (reparacion: Reparacion) => {
          const presupuestoCompleto: PresupuestoConReparacion = {
            ...presupuesto,
            reparacion
          };
          
          // Guardar en cache
          this.presupuestosCache.set(presupuesto.id, presupuestoCompleto);
          this.reparacionesCache.set(presupuesto.reparacion_id, reparacion);
          
          resolve(presupuestoCompleto);
        },
        error: () => {
          // Si hay error, devolver el presupuesto sin reparación
          resolve({
            ...presupuesto,
            reparacion: undefined
          });
        }
      });
    });
  }

  seleccionarPresupuesto(presupuesto: PresupuestoConReparacion, esEdicion: boolean = false, reparacion?: Reparacion): void {
    const target = esEdicion ? this.editBuffer : this.nuevo;
    
    if (reparacion && presupuesto.reparacion_id === reparacion.id) {
        presupuesto.reparacion = reparacion;
        this.reparacionesCache.set(presupuesto.reparacion_id, reparacion);
    } else if (!presupuesto.reparacion) {
        const reparacionCache = this.reparacionesCache.get(presupuesto.reparacion_id);
        if (reparacionCache) {
            presupuesto.reparacion = reparacionCache;
        } else {
            this.cargarReparacionParaPresupuesto(presupuesto);
        }
    }
    
    target.presupuestoSeleccionado = presupuesto;
    target.presupuesto_id = presupuesto.id;
    target.monto_total = presupuesto.monto_total;
    target.presupuestoBusqueda = `Presupuesto #${presupuesto.id}`;
    
    this.presupuestosCache.set(presupuesto.id, presupuesto);
    
    if (presupuesto.reparacion) {
        const reparacionEstado = presupuesto.reparacion.estado?.toLowerCase();
        
        if (reparacionEstado !== 'finalizado' && reparacionEstado !== 'finalizado') {
            this.alertService.showGenericError(
                `La reparación asociada a este presupuesto está en estado "${presupuesto.reparacion.estado}". 
                Solo se pueden facturar reparaciones finalizadas.`
            );
        }
    }
    
    this.mostrandoPresupuestos = false;
    this.presupuestosSugeridos = [];
  }

  private cargarReparacionParaPresupuesto(presupuesto: PresupuestoConReparacion): void {
    this.reparacionService.show(presupuesto.reparacion_id).subscribe({
        next: (reparacion: Reparacion) => {
            presupuesto.reparacion = reparacion;
            
            this.reparacionesCache.set(presupuesto.reparacion_id, reparacion);
            this.presupuestosCache.set(presupuesto.id, presupuesto);
            
            if (this.nuevo.presupuestoSeleccionado?.id === presupuesto.id) {
                this.nuevo.presupuestoSeleccionado.reparacion = reparacion;
            }
            
            if (this.editBuffer.presupuestoSeleccionado?.id === presupuesto.id) {
                this.editBuffer.presupuestoSeleccionado.reparacion = reparacion;
            }
            
            console.log('✅ Reparación cargada:', reparacion);
        },
        error: (error) => {
            console.error('❌ Error cargando reparación:', error);
        }
    });
  }

  seleccionarPresupuestoDelPicker(evento: {presupuesto: any, reparacion?: Reparacion}): void {
      const { presupuesto, reparacion } = evento;
      
      const esEdicion = this.selectedAction === 'listar' && this.editingId !== null;
      const target = esEdicion ? this.editBuffer : this.nuevo;
      
      const presupuestoCompleto: PresupuestoConReparacion = {
          ...presupuesto,
          reparacion: reparacion || presupuesto.reparacion
      };
      
      target.presupuestoSeleccionado = presupuestoCompleto;
      target.presupuesto_id = presupuesto.id;
      target.monto_total = presupuesto.monto_total;
      target.presupuestoBusqueda = `Presupuesto #${presupuesto.id}`;
      
      this.mostrandoPresupuestos = false;
      this.presupuestosSugeridos = [];
  }

  onPresupuestoSeleccionado(evento: {presupuesto: any, reparacion?: Reparacion}): void {
      const esEdicion = this.selectedAction === 'listar' && this.editingId !== null;
      
      if (esEdicion) {
          this.seleccionarPresupuesto(evento.presupuesto, true, evento.reparacion);
      } else {
          this.seleccionarPresupuesto(evento.presupuesto, false, evento.reparacion);
      }
  }

  limpiarPresupuesto(esEdicion: boolean = false): void {
    const target = esEdicion ? this.editBuffer : this.nuevo;
    
    target.presupuestoSeleccionado = undefined;
    target.presupuesto_id = undefined as any;
    target.presupuestoBusqueda = '';
    target.monto_total = null;
    
    this.presupuestosSugeridos = [];
    this.mostrandoPresupuestos = false;
  }

  cerrarMenuSugerencias(): void {
    this.mostrandoPresupuestos = false;
    this.presupuestosSugeridos = [];
  }

  ocultarPresupuestos(): void {
    setTimeout(() => {
      this.mostrandoPresupuestos = false;
    }, 200);
  }

  getDescripcionReparacion(presupuestoId: number): string {
    const presupuesto = this.presupuestosCache.get(presupuestoId);
    if (presupuesto?.reparacion?.descripcion) {
      return presupuesto.reparacion.descripcion;
    }
    
    return `Presupuesto #${presupuestoId}`;
  }

  getInfoCliente(presupuestoId: number): string {
    const presupuesto = this.presupuestosCache.get(presupuestoId);
    if (presupuesto?.reparacion?.cliente_nombre) {
      return presupuesto.reparacion.cliente_nombre;
    }
    
    if (presupuesto?.reparacion?.equipo?.cliente?.nombre) {
      return presupuesto.reparacion.equipo.cliente.nombre;
    }
    
    return 'Cliente no especificado';
  }

  getInfoEquipo(presupuestoId: number): string {
    const presupuesto = this.presupuestosCache.get(presupuestoId);
    if (presupuesto?.reparacion?.equipo_nombre) {
      return presupuesto.reparacion.equipo_nombre;
    }
    
    if (presupuesto?.reparacion?.equipo?.descripcion) {
      return presupuesto.reparacion.equipo.descripcion;
    }
    
    return 'Equipo no especificado';
  }

  getEstadoReparacion(presupuestoId: number): string {
    const presupuesto = this.presupuestosCache.get(presupuestoId);
    return presupuesto?.reparacion?.estado || 'Desconocido';
  }

  async crear(): Promise<void> {
    if (!this.nuevo.presupuestoSeleccionado) {
        this.alertService.showGenericError('Debe seleccionar un presupuesto.');
        return;
    }
    
    if (!this.nuevo.presupuestoSeleccionado.aceptado) {
        this.alertService.showGenericError('Solo se pueden facturar presupuestos aprobados.');
        return;
    }
    
    let estadoReparacionValido = false;
    
    if (this.nuevo.presupuestoSeleccionado.reparacion) {
        const estadoReparacion = this.nuevo.presupuestoSeleccionado.reparacion.estado?.toLowerCase();
        estadoReparacionValido = estadoReparacion === 'finalizado';
    } else {
        try {
            const reparacion = await this.reparacionService.show(this.nuevo.presupuestoSeleccionado.reparacion_id).toPromise();
            const estadoReparacion = reparacion?.estado?.toLowerCase();
            estadoReparacionValido = estadoReparacion === 'finalizado';
            
            if (reparacion) {
                this.reparacionesCache.set(this.nuevo.presupuestoSeleccionado.reparacion_id, reparacion);
                this.nuevo.presupuestoSeleccionado.reparacion = reparacion;
            }
        } catch (error) {
            console.error('Error al cargar reparación:', error);
        }
    }
    
    if (!estadoReparacionValido) {
        this.alertService.showGenericError(
            `La reparación asociada a este presupuesto no está finalizada. 
            Estado actual: ${this.nuevo.presupuestoSeleccionado.reparacion?.estado || 'desconocido'}`
        );
        return;
    }
    
    const payload = this.limpiar(this.nuevo);
    if (!this.valida(payload)) return;
    payload.fecha = this.toISODate(payload.fecha as string);

    this.alertService.showLoading('Creando factura...');

    this.facService.create(payload).subscribe({
        next: (nuevaFactura: any) => {
            this.alertService.closeLoading();
            const facturaCompleta = { ...payload, id: nuevaFactura.id, fecha: payload.fecha! } as Factura;
            this.facturasAll.unshift(facturaCompleta);
            this.applyFilter();
            
            this.searchService.setSearchData(this.facturasAll);
            
            this.nuevo = { 
                presupuesto_id: undefined as any, 
                numero: '', 
                letra: 'A', 
                fecha: new Date().toISOString().slice(0,10), 
                monto_total: null, 
                detalle: '',
                presupuestoBusqueda: ''
            };
            this.selectedAction = 'listar';
            this.alertService.showFacturaCreada();
        },
        error: (e) => { 
            this.alertService.closeLoading();
            this.alertService.showGenericError('Error al crear la factura'); 
        }
    });
  }

  async eliminar(id: number): Promise<void> {
    // ✅ VERIFICAR QUE EL ID SEA VÁLIDO
    if (!id || id <= 0) {
      this.alertService.showGenericError('ID de factura no válido');
      return;
    }

    const factura = this.facturasAll.find(f => f.id === id);
    
    // ✅ VERIFICAR QUE LA FACTURA EXISTA EN EL FRONTEND
    if (!factura) {
      this.alertService.showGenericError('Factura no encontrada en el listado');
      return;
    }

    const numeroFactura = `${factura.numero || ''}${factura.letra || ''}`;
    const confirmed = await this.alertService.confirmDeleteFactura(numeroFactura);
    if (!confirmed) return;

    this.alertService.showLoading('Eliminando factura...');

    // ✅ PRIMERO INTENTAR ELIMINAR DEL BACKEND
    this.facService.delete(id).subscribe({
      next: () => { 
        this.alertService.closeLoading();
        this.eliminarDelFrontend(id);
        this.alertService.showFacturaEliminada();
      },
      error: (error) => { 
        this.alertService.closeLoading();
        
        if (error.status === 404) {
          // ✅ SI NO EXISTE EN EL BACKEND, ELIMINARLA SOLO DEL FRONTEND
          this.eliminarDelFrontend(id);
          this.alertService.showSuccess('Factura eliminada del listado');
        } else {
          this.alertService.showGenericError('No se pudo eliminar la factura'); 
        }
      }
    });
  }

  // ✅ NUEVO MÉTODO PARA ELIMINAR DEL FRONTEND
  private eliminarDelFrontend(id: number): void {
    this.facturasAll = this.facturasAll.filter(f => f.id !== id);
    this.facturas = this.facturas.filter(f => f.id !== id);
    this.applyFilter();
    this.searchService.setSearchData(this.facturasAll);
  }

  startEdit(item: Factura): void {
    this.editingId = item.id;
    
    // Obtener información del presupuesto asociado
    const presupuesto = this.presupuestosCache.get(item.presupuesto_id);
    
    this.editBuffer = {
      presupuesto_id: item.presupuesto_id,
      numero: item.numero,
      letra: item.letra,
      fecha: (item.fecha ?? '').slice(0,10),
      monto_total: item.monto_total,
      detalle: item.detalle,
      presupuestoBusqueda: presupuesto ? 
        `Presupuesto #${presupuesto.id}` : 
        `Presupuesto #${item.presupuesto_id}`,
      presupuestoSeleccionado: presupuesto
    };
  }

  cancelEdit(): void { 
    this.editingId = null; 
    this.editBuffer = {
      presupuesto_id: undefined as any,
      numero: '',
      letra: 'A',
      fecha: new Date().toISOString().slice(0, 10),
      monto_total: null,
      detalle: '',
      presupuestoBusqueda: ''
    }; 
  }

  async saveEdit(id: number): Promise<void> {
    // Validar que el presupuesto esté aprobado
    if (!this.editBuffer.presupuestoSeleccionado) {
      this.alertService.showGenericError('Debe seleccionar un presupuesto.');
      return;
    }
    
    if (!this.editBuffer.presupuestoSeleccionado.aceptado) {
      this.alertService.showGenericError('Solo se pueden facturar presupuestos aprobados.');
      return;
    }
    
    if (this.editBuffer.presupuestoSeleccionado.reparacion) {
      const estadoReparacion = this.editBuffer.presupuestoSeleccionado.reparacion.estado?.toLowerCase();
      if (estadoReparacion !== 'finalizado') {
        this.alertService.showGenericError(
          `La reparación asociada a este presupuesto está en estado "${this.editBuffer.presupuestoSeleccionado.reparacion.estado}". 
          Solo se pueden facturar reparaciones finalizadas.`
        );
        return;
      }
    }
    
    const payload = this.limpiar(this.editBuffer);
    if (!this.valida(payload)) return;
    payload.fecha = this.toISODate(payload.fecha as string);

    this.alertService.showLoading('Actualizando factura...');

    this.facService.update(id, payload).subscribe({
      next: () => {
        this.alertService.closeLoading();
        const updateLocal = (arr: Factura[]) => {
          const idx = arr.findIndex(f => f.id === id);
          arr[idx] = { 
            ...arr[idx],
            ...payload, 
            fecha: payload.fecha!
          } as Factura;        
        };
        
        updateLocal(this.facturasAll);
        updateLocal(this.facturas);
        
        this.searchService.setSearchData(this.facturasAll);
        this.cancelEdit();
        this.alertService.showFacturaActualizada();
      },
      error: () => { 
        this.alertService.closeLoading();
        this.alertService.showGenericError('Error al actualizar la factura'); 
      }
    });
  }

  exportarTodasFacturas(): void {
    if (this.facturas.length === 0) {
      this.alertService.showGenericError('No hay facturas para exportar');
      return;
    }

    const reportComponent = new FacturaReportComponent(this.alertService)
    reportComponent.facturas = this.facturas;
    reportComponent.titulo = 'Todas las Facturas';
    reportComponent.generarReporte();
    this.mostrarModalExportacion = false;
  }

  private limpiar(obj: Partial<FacturaForm>): Partial<Factura> {
    const presupuestoId = typeof obj.presupuesto_id === 'string'
      ? Number(obj.presupuesto_id)
      : obj.presupuesto_id;

    let monto: number;
    if (obj.monto_total == null || obj.monto_total === '') {
      monto = 0;
    } else if (typeof obj.monto_total === 'string') {
      const trimmed = obj.monto_total.trim();
      monto = trimmed === '' ? 0 : Number(trimmed.replace(',', '.'));
    } else {
      monto = obj.monto_total;
    }

    return {
      presupuesto_id: presupuestoId!,
      numero: (obj.numero ?? '').toString().trim(),
      letra: (obj.letra ?? '').toString().trim().toUpperCase(),
      fecha: (obj.fecha ?? '').toString().slice(0,10),
      monto_total: monto,
      detalle: (obj.detalle ?? '').toString().trim()
    };
  }

  private valida(p: Partial<Factura>): boolean {
    if (!p.presupuesto_id || !p.numero || !p.letra || !p.fecha || p.monto_total === undefined || p.monto_total === null) {
      this.alertService.showGenericError('Completá: presupuesto_id, número, letra, fecha y monto_total.');
      return false;
    }
    if (isNaN(Number(p.presupuesto_id)) || Number(p.presupuesto_id) <= 0) { 
      this.alertService.showGenericError('presupuesto_id inválido.'); 
      return false; 
    }
    if (isNaN(Number(p.monto_total))) { 
      this.alertService.showGenericError('monto_total debe ser numérico.'); 
      return false; 
    }
    return true;
  }

  private toISODate(yyyyMMdd: string): string {
    return new Date(yyyyMMdd + 'T00:00:00Z').toISOString();
  }
}
