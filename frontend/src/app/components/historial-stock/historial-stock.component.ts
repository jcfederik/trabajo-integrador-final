import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, catchError, of } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import {
  HistorialStockService,
  HistorialStock,
  Paginated,
  HistorialStockFilters
} from '../../services/historial-stock.service';
import { SearchService } from '../../services/busquedaglobal';
import { AlertService } from '../../services/alert.service';
import { RepuestoService } from '../../services/repuestos.service';

type Accion = 'listar';

interface FiltrosComponente {
  repuesto_id?: number;
  tipo_mov?: string;
  desde?: string;
  hasta?: string;
  busqueda?: string;
}

@Component({
  selector: 'app-historial-stock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-stock.component.html',
  styleUrls: ['./historial-stock.component.css']
})
export class HistorialStockComponent implements OnInit, OnDestroy {
  // =============== ESTADO DEL COMPONENTE ===============
  selectedAction: Accion = 'listar';
  
  private itemsAll: HistorialStock[] = [];
  items: HistorialStock[] = [];
  page = 1;
  perPage = 20;
  lastPage = false;
  loading = false;
  loadingTipos = false;
  
  // =============== BÚSQUEDA Y FILTROS ===============
  searchTerm = '';
  mostrandoSugerencias = false;
  buscandoHistorial = false;
  isServerSearch = false;
  private serverSearchPage = 1;
  private serverSearchLastPage = false;
  private busquedaHistorial = new Subject<string>();
  private searchSub!: Subscription;
  
  // Filtros
  filtros: FiltrosComponente = {};
  tiposMovimiento: string[] = [];
  repuestosSugeridos: any[] = [];
  buscandoRepuestos = false;
  mostrandoRepuestos = false;
  private busquedaRepuesto = new Subject<string>();
  
  // Cache
  private repuestosInfoCache = new Map<number, any>();
  private tiposMovCache = new Map<string, { color: string, icono: string }>();
  
  constructor(
    private svc: HistorialStockService,
    private repuestoService: RepuestoService,
    public searchService: SearchService,
    private alertService: AlertService
  ) {}
  
  // =============== LIFECYCLE ===============
  ngOnInit(): void {
    this.cargar();
    this.cargarTiposMovimiento();
    window.addEventListener('scroll', this.onScroll, { passive: true });
    
    this.configurarBusquedaGlobal();
    this.configurarBusquedaHistorial();
    this.configurarBusquedaRepuestos();
  }
  
  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    this.busquedaHistorial.unsubscribe();
    this.busquedaRepuesto.unsubscribe();
    this.searchSub?.unsubscribe();
    this.searchService.clearSearch();
  }
  
  // =============== CONFIGURACIÓN DE BÚSQUEDAS ===============
  private configurarBusquedaGlobal(): void {
    this.searchService.setCurrentComponent('historial_stock');
    this.searchSub = this.searchService.searchTerm$.subscribe(term => {
      this.searchTerm = (term || '').trim();
      
      if (this.searchTerm) {
        this.onBuscarHistorial(this.searchTerm);
      } else {
        this.resetBusqueda();
      }
    });
  }
  
  private configurarBusquedaHistorial(): void {
    this.busquedaHistorial.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(termino => {
      this.buscarEnServidor(termino);
    });
  }
  
  private configurarBusquedaRepuestos(): void {
    this.busquedaRepuesto.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(termino => {
      this.buscarRepuestos(termino);
    });
  }
  
  // =============== CARGA DE DATOS ===============
  private cargarTiposMovimiento(): void {
    this.loadingTipos = true;
    this.svc.getTiposMovimiento().subscribe({
      next: (tipos) => {
        this.tiposMovimiento = tipos;
        tipos.forEach(tipo => {
          this.tiposMovCache.set(tipo, {
            color: this.svc.getTipoMovimientoColor(tipo),
            icono: this.svc.getTipoMovimientoIcono(tipo)
          });
        });
        this.loadingTipos = false;
      },
      error: () => {
        this.loadingTipos = false;
      }
    });
  }
  
  cargar(): void {
    if (this.loading || this.lastPage) return;
    this.loading = true;
    
    const filtrosServidor: HistorialStockFilters = {};
    if (this.filtros.repuesto_id) filtrosServidor.repuesto_id = this.filtros.repuesto_id;
    if (this.filtros.tipo_mov) filtrosServidor.tipo_mov = this.filtros.tipo_mov;
    if (this.filtros.desde) filtrosServidor.desde = this.filtros.desde;
    if (this.filtros.hasta) filtrosServidor.hasta = this.filtros.hasta;
    if (this.searchTerm) filtrosServidor.q = this.searchTerm;
    
    this.svc.list(this.page, this.perPage, filtrosServidor).subscribe({
      next: (res: Paginated<HistorialStock>) => {
        const batch = res.data ?? [];
        
        // Actualizar cache de repuestos
        batch.forEach(item => {
          if (item.repuesto && !this.repuestosInfoCache.has(item.repuesto_id)) {
            this.repuestosInfoCache.set(item.repuesto_id, item.repuesto);
          }
        });
        
        if (this.page === 1) {
          this.itemsAll = batch;
        } else {
          this.itemsAll = [...this.itemsAll, ...batch];
        }
        
        this.items = [...this.itemsAll];
        
        const itemsForSearch = this.itemsAll.map(item => ({
          ...item,
          repuesto_nombre: item.repuesto?.nombre || `Repuesto #${item.repuesto_id}`,
          repuesto_codigo: item.repuesto?.codigo || ''
        }));
        this.searchService.setSearchData(itemsForSearch);
        
        this.page++;
        this.lastPage = (res.next_page_url === null) || (this.page > res.last_page);
        this.loading = false;
      },
      error: (error) => { 
        console.error('Error cargando historial de stock:', error);
        this.loading = false; 
        this.alertService.showGenericError('Error al cargar el historial de stock');
      }
    });
  }
  
  // =============== BÚSQUEDA ===============
  onBuscarHistorial(termino: string): void {
    const terminoLimpio = (termino || '').trim();
    
    if (!terminoLimpio) {
      this.resetBusqueda();
      return;
    }
    
    this.searchTerm = terminoLimpio;
    this.mostrandoSugerencias = true;
    this.buscandoHistorial = true;
    
    if (terminoLimpio.length <= 2) {
      this.page = 1;
      this.lastPage = false;
      this.itemsAll = [];
      this.items = [];
      this.cargar();
      this.buscandoHistorial = false;
    } else {
      this.busquedaHistorial.next(terminoLimpio);
    }
  }
  
  private buscarEnServidor(termino: string): void {
    this.isServerSearch = true;
    this.serverSearchPage = 1;
    this.serverSearchLastPage = false;
    
    this.searchService.searchOnServer('historial_stock', termino, 1, this.perPage).subscribe({
      next: (response: any) => {
        const itemsEncontrados = response.data || response;
        
        this.itemsAll = Array.isArray(itemsEncontrados) ? itemsEncontrados : [];
        this.items = [...this.itemsAll];
        
        this.buscandoHistorial = false;
        this.mostrandoSugerencias = true;
        
        const itemsForSearch = this.itemsAll.map(item => ({
          ...item,
          repuesto_nombre: item.repuesto?.nombre || `Repuesto #${item.repuesto_id}`,
          repuesto_codigo: item.repuesto?.codigo || ''
        }));
        this.searchService.setSearchData(itemsForSearch);
      },
      error: (error) => {
        this.applyFilterLocal();
        this.buscandoHistorial = false;
      }
    });
  }
  
  private applyFilterLocal(): void {
    if (!this.searchTerm) {
      this.items = [...this.itemsAll];
      return;
    }
    
    const itemsWithInfo = this.itemsAll.map(item => ({
      ...item,
      repuesto_nombre: item.repuesto?.nombre || `Repuesto #${item.repuesto_id}`,
      repuesto_codigo: item.repuesto?.codigo || ''
    }));
    
    const filtered = this.searchService.search(itemsWithInfo, this.searchTerm, 'historial_stock');
    this.items = filtered as HistorialStock[];
  }
  
  resetBusqueda(): void {
    this.searchTerm = '';
    this.isServerSearch = false;
    this.serverSearchPage = 1;
    this.serverSearchLastPage = false;
    
    this.itemsAll = [];
    this.items = [];
    this.page = 1;
    this.lastPage = false;
    
    this.cargar();
  }
  
  // =============== FILTROS ===============
  aplicarFiltros(): void {
    this.itemsAll = [];
    this.items = [];
    this.page = 1;
    this.lastPage = false;
    this.cargar();
  }
  
  limpiarFiltros(): void {
    this.filtros = {};
    this.repuestosSugeridos = [];
    this.aplicarFiltros();
  }
  
  // =============== BÚSQUEDA DE REPUESTOS PARA FILTRO ===============
  onBuscarRepuesto(termino: string): void {
    this.busquedaRepuesto.next(termino);
  }
  
  private buscarRepuestos(termino: string): void {
    const terminoLimpio = termino || '';
    
    if (!terminoLimpio.trim()) {
      this.repuestosSugeridos = [];
      this.mostrandoRepuestos = false;
      return;
    }
    
    this.buscandoRepuestos = true;
    
    this.repuestoService.buscarRepuestos(terminoLimpio).subscribe({
      next: (response: any) => {
        const repuestos = response.data || response;
        this.repuestosSugeridos = Array.isArray(repuestos) ? repuestos.slice(0, 10) : [];
        this.mostrandoRepuestos = true;
        this.buscandoRepuestos = false;
      },
      error: (error) => {
        this.buscandoRepuestos = false;
        this.repuestosSugeridos = [];
      }
    });
  }
  
  seleccionarRepuesto(repuesto: any): void {
    this.filtros.repuesto_id = repuesto.id;
    this.repuestosSugeridos = [];
    this.mostrandoRepuestos = false;
    this.repuestosInfoCache.set(repuesto.id, repuesto);
    this.aplicarFiltros();
  }
  
  limpiarRepuesto(): void {
    this.filtros.repuesto_id = undefined;
    this.repuestosSugeridos = [];
    this.mostrandoRepuestos = false;
    this.aplicarFiltros();
  }
  
  ocultarRepuestos(): void {
    setTimeout(() => {
      this.mostrandoRepuestos = false;
    }, 200);
  }
  
  // =============== SCROLL INFINITO ===============
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
    
    this.searchService.searchOnServer('historial_stock', this.searchTerm, this.serverSearchPage, this.perPage).subscribe({
      next: (response: any) => {
        const nuevosItems = response.data || response;
        
        if (Array.isArray(nuevosItems) && nuevosItems.length > 0) {
          this.itemsAll = [...this.itemsAll, ...nuevosItems];
          this.items = [...this.itemsAll];
          
          const itemsForSearch = this.itemsAll.map(item => ({
            ...item,
            repuesto_nombre: item.repuesto?.nombre || `Repuesto #${item.repuesto_id}`,
            repuesto_codigo: item.repuesto?.codigo || ''
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
  
  // =============== UTILIDADES ===============
  getTipoColor(tipo: string): string {
    return this.tiposMovCache.get(tipo)?.color || 'secondary';
  }
  
  getTipoIcono(tipo: string): string {
    return this.tiposMovCache.get(tipo)?.icono || 'bi-circle';
  }
  
  getRepuestoNombre(repuestoId: number): string {
    return this.repuestosInfoCache.get(repuestoId)?.nombre || `Repuesto #${repuestoId}`;
  }
  
  getRepuestoCodigo(repuestoId: number): string {
    return this.repuestosInfoCache.get(repuestoId)?.codigo || '';
  }
  
  formatFecha(fecha: string): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR') + ' ' + date.toLocaleTimeString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  getCantidadIcono(cantidad: number): string {
    return cantidad >= 0 ? 'bi-arrow-up text-success' : 'bi-arrow-down text-danger';
  }
  
  getCantidadTexto(cantidad: number): string {
    return cantidad >= 0 ? `+${cantidad}` : `${cantidad}`;
  }
  
  cerrarMenuSugerencias(): void {
    this.mostrandoSugerencias = false;
  }
  
  ocultarSugerencias(): void {
    setTimeout(() => {
      this.mostrandoSugerencias = false;
    }, 200);
  }
}