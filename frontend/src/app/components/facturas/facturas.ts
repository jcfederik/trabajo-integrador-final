import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaService, Factura, Paginated } from '../../services/facturas';
import { PresupuestoService, Presupuesto } from '../../services/presupuesto.service';
import { ReparacionService, Reparacion } from '../../services/reparacion.service';
import { SearchService } from '../../services/busquedaglobal';
import { FacturaReportComponent } from '../factura-report/factura-report';
import { ExportModalComponent } from '../export-modal/export-modal';
import { ClienteService } from '../../services/cliente.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

type Accion = 'listar' | 'crear';

type FacturaForm = Omit<Factura, 'fecha' | 'monto_total' | 'id'> & {
  id?: number;
  fecha: string;
  monto_total: number | string | null;
  presupuestoBusqueda: string;
  presupuestoSeleccionado?: Presupuesto;
};

@Component({
  selector: 'app-facturas',
  standalone: true,
  imports: [CommonModule, FormsModule, ExportModalComponent ],
  templateUrl: './facturas.html',
  styleUrls: ['./facturas.css']
})
export class FacturasComponent implements OnInit, OnDestroy {
  // ====== PROPIEDADES DEL COMPONENTE ======
  selectedAction: Accion = 'listar';

  // Gestión de datos
  private facturasAll: Factura[] = [];
  facturas: Factura[] = [];
  page = 1;
  perPage = 10;
  lastPage = false;
  loading = false;

  // Edición inline - AHORA CON BÚSQUEDA DE PRESUPUESTOS
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
  
  // Creación
  nuevo: FacturaForm = {
    presupuesto_id: undefined as any,
    numero: '',
    letra: 'A',
    fecha: new Date().toISOString().slice(0, 10),
    monto_total: null,
    detalle: '',
    presupuestoBusqueda: ''
  };


  // Búsqueda de presupuestos (compartido entre crear y editar)
  presupuestosSugeridos: Presupuesto[] = [];
  mostrandoPresupuestos = false;
  buscandoPresupuestos = false;
  private busquedaPresupuesto = new Subject<string>();
  private reparacionesCache = new Map<number, string>();

  // Búsqueda global
  private searchSub?: Subscription;
  searchTerm = '';

  // Modal de exportación
  mostrarModalExportacion = false;

  constructor(
    private facService: FacturaService,
    private presupuestoService: PresupuestoService,
    private reparacionService: ReparacionService,
    private searchService: SearchService,
    private clienteService: ClienteService
  ) {}

  // ====== CICLO DE VIDA ======
  ngOnInit(): void {
    this.cargar();
    window.addEventListener('scroll', this.onScroll, { passive: true });
    
    this.busquedaPresupuesto.pipe(
      debounceTime(50),
      distinctUntilChanged()
    ).subscribe(termino => {
      this.buscarPresupuestos(termino);
    });

    this.searchService.setCurrentComponent('facturas');
    this.searchSub = this.searchService.searchTerm$.subscribe(term => {
      this.searchTerm = (term || '').trim();
      this.applyFilter();
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    this.busquedaPresupuesto.unsubscribe();
    this.searchSub?.unsubscribe();
    this.searchService.clearSearch();
  }

  // ====== GESTIÓN DE ACCIONES ======
  seleccionarAccion(a: Accion) { 
    this.selectedAction = a; 
  }

  // ====== CARGA Y PAGINACIÓN ======
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

  resetLista() {
    this.facturasAll = [];
    this.facturas = [];
    this.page = 1;
    this.lastPage = false;
    this.cargar();
  }

  // ====== BÚSQUEDA GLOBAL ======
  private applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    
    if (!term) {
      this.facturas = [...this.facturasAll];
      return;
    }

    this.facturas = this.searchService.search(this.facturasAll, term, 'facturas');
  }

  // ====== BÚSQUEDA DE PRESUPUESTOS (COMPARTIDO) ======
  onBuscarPresupuesto(termino: string, esEdicion: boolean = false): void {
    if (termino.length > 0) {
      this.mostrandoPresupuestos = true;
      this.busquedaPresupuesto.next(termino);
    } else {
      this.presupuestosSugeridos = [];
      this.mostrandoPresupuestos = false;
    }
  }

  buscarPresupuestos(termino: string): void {
    const terminoLimpio = termino.trim();
    
    if (!terminoLimpio) {
      this.presupuestosSugeridos = [];
      this.mostrandoPresupuestos = false;
      return;
    }

    this.buscandoPresupuestos = true;
    
    this.presupuestoService.buscarPresupuestos(terminoLimpio).subscribe({
      next: (presupuestos: Presupuesto[]) => {
        this.presupuestosSugeridos = presupuestos;
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

  seleccionarPresupuesto(presupuesto: Presupuesto, esEdicion: boolean = false): void {
    if (esEdicion) {
      // Para edición
      this.editBuffer.presupuestoSeleccionado = presupuesto;
      this.editBuffer.presupuesto_id = presupuesto.id;
      this.editBuffer.presupuestoBusqueda = `Presupuesto #${presupuesto.id}`;
    } else {
      // Para creación
      this.nuevo.presupuestoSeleccionado = presupuesto;
      this.nuevo.presupuesto_id = presupuesto.id;
      this.nuevo.presupuestoBusqueda = `Presupuesto #${presupuesto.id}`;
    }
    
    // 🔥 NUEVO: Cerrar el menú de sugerencias inmediatamente
    this.mostrandoPresupuestos = false;
    this.presupuestosSugeridos = [];

    const montoTarget = esEdicion ? this.editBuffer : this.nuevo;
    if (!montoTarget.monto_total && presupuesto.monto_total != null) {
      montoTarget.monto_total = presupuesto.monto_total;
    }
    
    if (!montoTarget.detalle) {
      montoTarget.detalle = `Factura asociada al presupuesto #${presupuesto.id}`;
    }
  }

  // 🔥 NUEVO: Método para cerrar el menú inmediatamente al seleccionar
  cerrarMenuSugerencias(): void {
    this.mostrandoPresupuestos = false;
    this.presupuestosSugeridos = [];
  }

  limpiarPresupuesto(esEdicion: boolean = false): void {
    if (esEdicion) {
      this.editBuffer.presupuestoSeleccionado = undefined;
      this.editBuffer.presupuesto_id = undefined as any;
      this.editBuffer.presupuestoBusqueda = '';
    } else {
      this.nuevo.presupuestoSeleccionado = undefined;
      this.nuevo.presupuesto_id = undefined as any;
      this.nuevo.presupuestoBusqueda = '';
    }
    this.presupuestosSugeridos = [];
    this.mostrandoPresupuestos = false;
  }

  ocultarPresupuestos(): void {
    setTimeout(() => {
      this.mostrandoPresupuestos = false;
    }, 200);
  }

  // ====== GESTIÓN DE DESCRIPCIONES ======
  getDescripcionReparacion(reparacionId: number): string {
    const presupuesto = this.presupuestosSugeridos.find(p => p.reparacion_id === reparacionId);
    if (presupuesto?.reparacion_descripcion) {
      return presupuesto.reparacion_descripcion;
    }
    
    if (this.reparacionesCache.has(reparacionId)) {
      return this.reparacionesCache.get(reparacionId) || `Reparación #${reparacionId}`;
    }

    this.cargarDescripcionReparacion(reparacionId);
    return `Reparación #${reparacionId}`;
  }

  private cargarDescripcionReparacion(reparacionId: number): void {
    this.reparacionService.show(reparacionId).subscribe({
      next: (reparacion) => {
        const descripcion = reparacion.descripcion || `Reparación #${reparacionId}`;
        this.reparacionesCache.set(reparacionId, descripcion);
      },
      error: () => {
        this.reparacionesCache.set(reparacionId, `Reparación #${reparacionId}`);
      }
    });
  }

  // ====== CREACIÓN ======
  crear(): void {
    const payload = this.limpiar(this.nuevo);
    if (!this.valida(payload)) return;
    payload.fecha = this.toISODate(payload.fecha as string);

    this.facService.create(payload).subscribe({
      next: (nuevaFactura: any) => {
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
      },
      error: (e) => { 
        alert(e?.error?.error ?? 'Error al crear la factura'); 
      }
    });
  }

  // ====== ELIMINACIÓN ======
  eliminar(id: number): void {
    if (!confirm('¿Eliminar esta factura?')) return;
    
    this.facService.delete(id).subscribe({
      next: () => { 
        this.facturasAll = this.facturasAll.filter(f => f.id !== id);
        this.applyFilter();
        this.searchService.setSearchData(this.facturasAll);
      },
      error: (e) => { 
        alert(e?.error?.error ?? 'No se pudo eliminar'); 
      }
    });
  }

  // ====== EDICIÓN INLINE MEJORADA ======
  startEdit(item: Factura): void {
    this.editingId = item.id;
    this.editBuffer = {
      presupuesto_id: item.presupuesto_id,
      numero: item.numero,
      letra: item.letra,
      fecha: (item.fecha ?? '').slice(0,10),
      monto_total: item.monto_total,
      detalle: item.detalle,
      presupuestoBusqueda: `Presupuesto #${item.presupuesto_id}`,
      presupuestoSeleccionado: undefined // Se cargará si es necesario
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

  saveEdit(id: number): void {
    const payload = this.limpiar(this.editBuffer);
    if (!this.valida(payload)) return;
    payload.fecha = this.toISODate(payload.fecha as string);

    this.facService.update(id, payload).subscribe({
      next: () => {
        const updateLocal = (arr: Factura[]) => {
          const idx = arr.findIndex(f => f.id === id);
          if (idx >= 0) arr[idx] = { ...arr[idx], ...payload, fecha: payload.fecha! } as Factura;
        };
        
        updateLocal(this.facturasAll);
        updateLocal(this.facturas);
        
        this.searchService.setSearchData(this.facturasAll);
        this.cancelEdit();
      },
      error: (e) => { 
        alert(e?.error?.error ?? 'Error al actualizar'); 
      }
    });
  }

  // ====== EXPORTACIÓN MEJORADA ======
  abrirModalExportacion(): void {
    this.mostrarModalExportacion = true;
  }

  cerrarModalExportacion(): void {
    this.mostrarModalExportacion = false;
  }

  exportarTodasFacturas(): void {
    if (this.facturas.length === 0) {
      alert('No hay facturas para exportar');
      return;
    }

    const reportComponent = new FacturaReportComponent();
    reportComponent.facturas = this.facturas;
    reportComponent.titulo = 'Todas las Facturas';
    reportComponent.generarReporte();
    this.mostrarModalExportacion = false;
  }

  // ====== HELPERS ======
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
      alert('Completá: presupuesto_id, número, letra, fecha y monto_total.');
      return false;
    }
    if (isNaN(Number(p.presupuesto_id)) || Number(p.presupuesto_id) <= 0) { 
      alert('presupuesto_id inválido.'); 
      return false; 
    }
    if (isNaN(Number(p.monto_total))) { 
      alert('monto_total debe ser numérico.'); 
      return false; 
    }
    return true;
  }

  private toISODate(yyyyMMdd: string): string {
    return new Date(yyyyMMdd + 'T00:00:00Z').toISOString();
  }
}