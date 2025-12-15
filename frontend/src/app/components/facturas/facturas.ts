import { Component, OnInit, OnDestroy, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, of, Observable } from 'rxjs';
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
  presupuestoSeleccionado?: PresupuestoConReparacion;
};

interface PresupuestoConReparacion extends Presupuesto {
  reparacion?: Reparacion;
  yaFacturado?: boolean; 
  facturaExistente?: {   
    id: number;
    numero: string;
    letra: string;
  };
}

interface PresupuestoConFactura extends Presupuesto {
  yaFacturado: boolean;
  facturaExistente?: {
    id: number;
    numero: string;
    letra: string;
  };
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
  
  private reparacionesCache = new Map<number, Reparacion>();
  private presupuestosCache = new Map<number, PresupuestoConReparacion>();
  
  private busquedaPresupuestoCache = new Map<string, PresupuestoConReparacion[]>();
  private busquedaPresupuestoTiempo = new Map<string, number>();

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

  // CONFIGURAR BÚSQUEDA PRESUPUESTOS
  private configurarBusquedaPresupuestos(): void {
    this.busquedaPresupuesto.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(termino => {
      this.buscarPresupuestos(termino);
    });
  }

  // CONFIGURAR BÚSQUEDA GLOBAL
  private configurarBusquedaGlobal(): void {
    this.searchService.setCurrentComponent('facturas');
    this.searchSub = this.searchService.searchTerm$.subscribe(term => {
      this.searchTerm = (term || '').trim();
      this.applyFilter();
    });
  }

  // SELECCIONAR ACCIÓN
  seleccionarAccion(a: Accion): void { 
    this.selectedAction = a; 
  }

  // ABRIR MODAL EXPORTACIÓN
  abrirModalExportacion(): void {
    this.mostrarModalExportacion = true;
  }

  // CERRAR MODAL EXPORTACIÓN
  cerrarModalExportacion(): void {
    this.mostrarModalExportacion = false;
  }

  // TOGGLE COBROS
  toggleCobros(facturaId: number): void {
    this.mostrarCobros[facturaId] = !this.mostrarCobros[facturaId];
  }

  // ABRIR MODAL COBROS
  abrirModalCobros(factura: Factura): void {
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

  // CERRAR MODAL COBROS
  cerrarModalCobros(): void {}

  // CARGAR DATOS
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
        
        this.cargarInformacionPresupuestos(nuevasFacturas);
      },
      error: () => { 
        this.loading = false; 
        this.alertService.showGenericError('Error al cargar las facturas');
      }
    });
  }

  // CARGAR INFORMACIÓN PRESUPUESTOS
  private cargarInformacionPresupuestos(facturas: Factura[]): void {
    const presupuestosIds = [...new Set(facturas.map(f => f.presupuesto_id))];
    
    presupuestosIds.forEach(presupuestoId => {
      if (!this.presupuestosCache.has(presupuestoId)) {
        this.cargarPresupuestoCompleto(presupuestoId);
      }
    });
  }

  // CARGAR PRESUPUESTO COMPLETO
  private cargarPresupuestoCompleto(presupuestoId: number): void {
    this.presupuestoService.show(presupuestoId).pipe(
      switchMap((presupuesto: Presupuesto) => {
        const presupuestoConReparacion: PresupuestoConReparacion = {
          ...presupuesto,
          reparacion: presupuesto.reparacion
        };
        this.presupuestosCache.set(presupuestoId, presupuestoConReparacion);
        
        if (presupuesto.reparacion) {
          this.reparacionesCache.set(presupuesto.reparacion_id, presupuesto.reparacion);
        }
        
        return of(presupuestoConReparacion);
      }),
      catchError(() => {
        return of(null);
      })
    ).subscribe();
  }

  // RESET LISTA
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

  // SCROLL
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

  // APLICAR FILTRO
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

  // BUSCAR EN SERVIDOR
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

  // BUSCAR PRESUPUESTO
  onBuscarPresupuesto(termino: string, esEdicion: boolean = false): void {
    if (termino.length > 0) {
      this.mostrandoPresupuestos = true;
      this.busquedaPresupuesto.next(termino);
    } else {
      this.presupuestosSugeridos = [];
      this.mostrandoPresupuestos = false;
    }
  }

  // BUSCAR PRESUPUESTOS
  private buscarPresupuestos(termino: string): void {
    const terminoLimpio = termino.trim();
    
    if (!terminoLimpio) {
      this.presupuestosSugeridos = [];
      this.mostrandoPresupuestos = false;
      return;
    }

    const ahora = Date.now();
    const cacheEntry = this.busquedaPresupuestoCache.get(terminoLimpio);
    const cacheTime = this.busquedaPresupuestoTiempo.get(terminoLimpio);
    
    if (cacheEntry && cacheTime && (ahora - cacheTime < 30000)) {
      this.presupuestosSugeridos = cacheEntry;
      this.mostrandoPresupuestos = true;
      this.buscandoPresupuestos = false;
      return;
    }

    this.buscandoPresupuestos = true;
    
    this.presupuestoService.buscarPresupuestos(terminoLimpio).pipe(
      switchMap((presupuestos: Presupuesto[]) => {
        const presupuestosFacturables = this.filtrarPresupuestosFacturables(presupuestos);
        
        return this.verificarPresupuestosConFactura(presupuestosFacturables);
      }),
      map((presupuestosConEstado: PresupuestoConFactura[]) => {
        const presupuestosFormateados = this.formatearPresupuestosParaDropdown(presupuestosConEstado);
        
        this.busquedaPresupuestoCache.set(terminoLimpio, presupuestosFormateados);
        this.busquedaPresupuestoTiempo.set(terminoLimpio, ahora);
        
        return presupuestosFormateados;
      }),
      catchError(() => {
        return of([]);
      })
    ).subscribe({
      next: (presupuestosCompletos: PresupuestoConReparacion[]) => {
        this.presupuestosSugeridos = presupuestosCompletos
          .sort((a, b) => {
            if (!a.yaFacturado && b.yaFacturado) return -1;
            if (a.yaFacturado && !b.yaFacturado) return 1;
            if (a.aceptado && !b.aceptado) return -1;
            if (!a.aceptado && b.aceptado) return 1;
            return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
          })
          .slice(0, 10);
        
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

  // VERIFICAR PRESUPUESTOS CON FACTURA
  private verificarPresupuestosConFactura(presupuestos: Presupuesto[]): Observable<PresupuestoConFactura[]> {
    if (presupuestos.length === 0) {
      return of([]);
    }

    const presupuestosIds = presupuestos.map(p => p.id);
    
    return this.facService.verificarPresupuestosFacturados(presupuestosIds).pipe(
      map((facturados: any[]) => {
        const presupuestosFacturadosMap = new Map<number, any>();
        facturados.forEach(factura => {
          if (factura.presupuesto_id) {
            presupuestosFacturadosMap.set(factura.presupuesto_id, {
              id: factura.id,
              numero: factura.numero,
              letra: factura.letra
            });
          }
        });
        
        return presupuestos.map(presupuesto => {
          const facturaExistente = presupuestosFacturadosMap.get(presupuesto.id);
          
          return {
            ...presupuesto,
            yaFacturado: !!facturaExistente,
            facturaExistente: facturaExistente
          } as PresupuestoConFactura;
        });
      }),
      catchError(() => {
        return of(presupuestos.map(p => ({
          ...p,
          yaFacturado: false,
          facturaExistente: undefined
        } as PresupuestoConFactura)));
      })
    );
  }

  // FORMATEAR PRESUPUESTOS PARA DROPDOWN
  private formatearPresupuestosParaDropdown(presupuestos: PresupuestoConFactura[]): PresupuestoConReparacion[] {
    return presupuestos.map(p => {
      const presupuestoConReparacion: PresupuestoConReparacion = {
        ...p,
        yaFacturado: p.yaFacturado,
        facturaExistente: p.facturaExistente,
        reparacion: p.reparacion ? {
          ...p.reparacion,
          equipo_nombre: p.reparacion.equipo_nombre || 
                        p.reparacion.equipo?.descripcion || 
                        `Equipo #${p.reparacion.equipo_id}`,
          cliente_nombre: p.reparacion.cliente_nombre || 
                         p.reparacion.equipo?.cliente?.nombre || 
                         `Cliente #${p.reparacion.equipo?.cliente_id}`,
          tecnico_nombre: p.reparacion.tecnico_nombre || 
                         p.reparacion.tecnico?.nombre || 
                         `Técnico #${p.reparacion.usuario_id}`
        } : undefined
      };
      
      this.presupuestosCache.set(p.id, presupuestoConReparacion);
      if (p.reparacion) {
        this.reparacionesCache.set(p.reparacion_id, presupuestoConReparacion.reparacion!);
      }
      
      return presupuestoConReparacion;
    });
  }

  // FILTRAR PRESUPUESTOS FACTURABLES
  private filtrarPresupuestosFacturables(presupuestos: Presupuesto[]): Presupuesto[] {
    return presupuestos.filter(presupuesto => {
      if (!presupuesto.aceptado) return false;
      
      const reparacionCache = this.reparacionesCache.get(presupuesto.reparacion_id);
      if (reparacionCache) {
        if (reparacionCache.estado?.toLowerCase() !== 'finalizada') {
          return false;
        }
      }
      
      if (presupuesto.reparacion) {
        if (presupuesto.reparacion.estado?.toLowerCase() !== 'finalizada') {
          return false;
        }
      }
      
      return true;
    });
  }

  // SELECCIONAR PRESUPUESTO
  seleccionarPresupuesto(presupuesto: PresupuestoConReparacion, esEdicion: boolean = false, reparacion?: Reparacion): void {
    if (presupuesto.yaFacturado) {
      const facturaExistente = presupuesto.facturaExistente;
      if (facturaExistente) {
        this.alertService.showGenericError(
          `Este presupuesto ya tiene una factura: ${facturaExistente.numero}${facturaExistente.letra ? ' (' + facturaExistente.letra + ')' : ''}`
        );
      } else {
        this.alertService.showGenericError('Este presupuesto ya tiene una factura asociada.');
      }
      return;
    }

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
        
        if (reparacionEstado !== 'finalizada') {
            this.alertService.showGenericError(
                `La reparación asociada a este presupuesto está en estado "${presupuesto.reparacion.estado}". 
                Solo se pueden facturar reparaciones finalizadas.`
            );
        }
    }
    
    this.mostrandoPresupuestos = false;
    this.presupuestosSugeridos = [];
  }

  // CARGAR REPARACIÓN PARA PRESUPUESTO
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
            
        },
        error: (error) => {}
    });
  }

  // SELECCIONAR PRESUPUESTO DEL PICKER
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

  // ON PRESUPUESTO SELECCIONADO
  onPresupuestoSeleccionado(evento: {presupuesto: any, reparacion?: Reparacion}): void {
      const esEdicion = this.selectedAction === 'listar' && this.editingId !== null;
      
      if (esEdicion) {
          this.seleccionarPresupuesto(evento.presupuesto, true, evento.reparacion);
      } else {
          this.seleccionarPresupuesto(evento.presupuesto, false, evento.reparacion);
      }
  }

  // LIMPIAR PRESUPUESTO
  limpiarPresupuesto(esEdicion: boolean = false): void {
    const target = esEdicion ? this.editBuffer : this.nuevo;
    
    target.presupuestoSeleccionado = undefined;
    target.presupuesto_id = undefined as any;
    target.presupuestoBusqueda = '';
    target.monto_total = null;
    
    this.presupuestosSugeridos = [];
    this.mostrandoPresupuestos = false;
  }

  // CERRAR MENÚ SUGERENCIAS
  cerrarMenuSugerencias(): void {
    this.mostrandoPresupuestos = false;
    this.presupuestosSugeridos = [];
  }

  // OCULTAR PRESUPUESTOS
  ocultarPresupuestos(): void {
    setTimeout(() => {
      this.mostrandoPresupuestos = false;
    }, 200);
  }

  // GET DESCRIPCIÓN REPARACIÓN
  getDescripcionReparacion(presupuestoId: number): string {
    const presupuesto = this.presupuestosCache.get(presupuestoId);
    if (presupuesto?.reparacion?.descripcion) {
      return presupuesto.reparacion.descripcion;
    }
    
    return `Presupuesto #${presupuestoId}`;
  }

  // GET INFO CLIENTE
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

  // GET INFO EQUIPO
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

  // GET ESTADO REPARACIÓN
  getEstadoReparacion(presupuestoId?: number): string {
    if (!presupuestoId) return 'Desconocido';
    
    const presupuesto = this.presupuestosCache.get(presupuestoId);
    return presupuesto?.reparacion?.estado || 'Desconocido';
  }

  // TRACK BY PRESUPUESTO ID
  trackByPresupuestoId(index: number, presupuesto: PresupuestoConReparacion): number {
    return presupuesto.id;
  }

  // CREAR
  async crear(): Promise<void> {
    if (!this.nuevo.presupuestoSeleccionado) {
      this.alertService.showGenericError('Debe seleccionar un presupuesto.');
      return;
    }

    try {
      const resultado = await this.facService.verificarPresupuestosFacturados([
        this.nuevo.presupuestoSeleccionado.id
      ]).toPromise();

      if (resultado && resultado.length > 0) {
        const facturaExistente = resultado[0];
        this.alertService.showGenericError(
          `Este presupuesto ya tiene una factura: ${facturaExistente.numero}${facturaExistente.letra ? ' (' + facturaExistente.letra + ')' : ''}`
        );
        return;
      }
    } catch (error) {}

    if (!this.nuevo.presupuestoSeleccionado.aceptado) {
      this.alertService.showGenericError('Solo se pueden facturar presupuestos aprobados.');
      return;
    }

    let estadoReparacionValido = false;

    if (this.nuevo.presupuestoSeleccionado.reparacion) {
      const estadoReparacion = this.nuevo.presupuestoSeleccionado.reparacion.estado?.toLowerCase();
      estadoReparacionValido = estadoReparacion === 'finalizada';
    } else {
      try {
        const reparacion = await this.reparacionService.show(this.nuevo.presupuestoSeleccionado.reparacion_id).toPromise();
        const estadoReparacion = reparacion?.estado?.toLowerCase();
        estadoReparacionValido = estadoReparacion === 'finalizada';

        if (reparacion) {
          this.reparacionesCache.set(this.nuevo.presupuestoSeleccionado.reparacion_id, reparacion);
          this.nuevo.presupuestoSeleccionado.reparacion = reparacion;
        }
      } catch (error) {}
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
          fecha: new Date().toISOString().slice(0, 10),
          monto_total: null,
          detalle: '',
          presupuestoBusqueda: ''
        };
        
        this.selectedAction = 'listar';
        
        this.alertService.showFacturaCreada();
      },
      error: (e) => {
        this.alertService.closeLoading();
        
        if (e.status === 400 && e.error?.detalles) {
          const errores = e.error.detalles;
          const mensajeError = Object.values(errores).flat().join(', ');
          this.alertService.showGenericError(`Error de validación: ${mensajeError}`);
        } else if (e.status === 400 && e.error?.error) {
          this.alertService.showGenericError(e.error.error);
        } else {
          this.alertService.showGenericError('Error al crear la factura');
        }
      }
    });
  }

  // ELIMINAR
  async eliminar(id: number): Promise<void> {
    if (!id || id <= 0) {
      this.alertService.showGenericError('ID de factura no válido');
      return;
    }

    const factura = this.facturasAll.find(f => f.id === id);
    
    if (!factura) {
      this.alertService.showGenericError('Factura no encontrada en el listado');
      return;
    }

    const numeroFactura = `${factura.numero || ''}${factura.letra || ''}`;
    const confirmed = await this.alertService.confirmDeleteFactura(numeroFactura);
    if (!confirmed) return;

    this.alertService.showLoading('Eliminando factura...');

    this.facService.delete(id).subscribe({
      next: () => { 
        this.alertService.closeLoading();
        this.eliminarDelFrontend(id);
        this.alertService.showFacturaEliminada();
      },
      error: (error) => { 
        this.alertService.closeLoading();
        
        if (error.status === 404) {
          this.eliminarDelFrontend(id);
          this.alertService.showSuccess('Factura eliminada del listado');
        } else {
          this.alertService.showGenericError('No se pudo eliminar la factura'); 
        }
      }
    });
  }

  // ELIMINAR DEL FRONTEND
  private eliminarDelFrontend(id: number): void {
    this.facturasAll = this.facturasAll.filter(f => f.id !== id);
    this.facturas = this.facturas.filter(f => f.id !== id);
    this.applyFilter();
    this.searchService.setSearchData(this.facturasAll);
  }

  // START EDIT
  startEdit(item: Factura): void {
    this.editingId = item.id;
    
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

  // CANCEL EDIT
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

  // SAVE EDIT
  async saveEdit(id: number): Promise<void> {
    if (!this.editBuffer.presupuestoSeleccionado) {
      this.alertService.showGenericError('Debe seleccionar un presupuesto.');
      return;
    }

    try {
      const resultado = await this.facService.verificarPresupuestosFacturados([
        this.editBuffer.presupuestoSeleccionado.id
      ]).toPromise();

      if (resultado && resultado.length > 0) {
        const facturaExistente = resultado[0];
        if (facturaExistente.id !== id) {
          this.alertService.showGenericError(
            `Este presupuesto ya tiene una factura: ${facturaExistente.numero}${facturaExistente.letra ? ' (' + facturaExistente.letra + ')' : ''}`
          );
          return;
        }
      }
    } catch (error) {}

    if (!this.editBuffer.presupuestoSeleccionado.aceptado) {
      this.alertService.showGenericError('Solo se pueden facturar presupuestos aprobados.');
      return;
    }

    if (this.editBuffer.presupuestoSeleccionado.reparacion) {
      const estadoReparacion = this.editBuffer.presupuestoSeleccionado.reparacion.estado?.toLowerCase();
      if (estadoReparacion !== 'finalizada') {
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
      error: (e) => {
        this.alertService.closeLoading();
        
        if (e.status === 400 && e.error?.detalles) {
          const errores = e.error.detalles;
          const mensajeError = Object.values(errores).flat().join(', ');
          this.alertService.showGenericError(`Error de validación: ${mensajeError}`);
        } else if (e.status === 400 && e.error?.error) {
          this.alertService.showGenericError(e.error.error);
        } else {
          this.alertService.showGenericError('Error al actualizar la factura');
        }
      }
    });
  }

  // EXPORTAR TODAS FACTURAS
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

  // LIMPIAR
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

  // VALIDAR
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

  // TO ISO DATE
  private toISODate(yyyyMMdd: string): string {
    return new Date(yyyyMMdd + 'T00:00:00Z').toISOString();
  }
  
  // FORMATEAR DISPLAY TEXT PRESUPUESTO
  private formatearDisplayTextPresupuesto(presupuesto: PresupuestoConReparacion): string {
    const monto = presupuesto.monto_total ? 
      `$${presupuesto.monto_total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
      'Sin monto';
    
    const estado = presupuesto.aceptado ? '✓ Aceptado' : '✗ Pendiente';
    const fecha = presupuesto.fecha ? new Date(presupuesto.fecha).toLocaleDateString('es-AR') : 'Sin fecha';
    
    if (!presupuesto.reparacion && this.reparacionesCache.has(presupuesto.reparacion_id)) {
        presupuesto.reparacion = this.reparacionesCache.get(presupuesto.reparacion_id);
    }
    
    let detalles = [];
    detalles.push(`Presupuesto #${presupuesto.id} | ${monto} | ${estado} | ${fecha}`);
    
    if (presupuesto.reparacion) {
        const estadoReparacion = presupuesto.reparacion.estado || 'Desconocido';
        detalles.push(`Reparación: ${presupuesto.reparacion.descripcion || `#${presupuesto.reparacion_id}`}`);
        detalles.push(`Estado: ${estadoReparacion}`);
        
        const clienteNombre = presupuesto.reparacion.cliente_nombre || 
                             presupuesto.reparacion.equipo?.cliente?.nombre || 
                             'Cliente no especificado';
        detalles.push(`Cliente: ${clienteNombre}`);
        
        const equipoNombre = presupuesto.reparacion.equipo_nombre || 
                           presupuesto.reparacion.equipo?.descripcion || 
                           'Equipo no especificado';
        detalles.push(`Equipo: ${equipoNombre}`);
    } else {
        detalles.push(`Reparación: #${presupuesto.reparacion_id}`);
    }
    
    return detalles.join(' · ');
  }

  // GET ESTADO REPARACIÓN BADGE CLASS
  getEstadoReparacionBadgeClass(estado?: string): string {
      if (!estado) return 'estado-desconocido';
      
      switch (estado.toLowerCase()) {
          case 'finalizada':
          case 'finalizado':
              return 'estado-finalizada';
          case 'en_proceso':
          case 'en proceso':
              return 'estado-proceso';
          case 'pendiente':
              return 'estado-pendiente';
          case 'cancelada':
          case 'cancelado':
              return 'estado-cancelada';
          default:
              return 'estado-desconocido';
      }
  }
}