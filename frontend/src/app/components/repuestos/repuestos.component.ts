import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

import { RepuestoService, Repuesto, PaginatedResponse } from '../../services/repuestos.service';
import { ProveedoresService, Proveedor } from '../../services/proveedores.service';
import { SearchService } from '../../services/busquedaglobal';
import { SearchSelectorComponent, SearchResult } from '../../components/search-selector/search-selector.component';
import { AlertService } from '../../services/alert.service';

type Accion = 'listar' | 'comprar';

@Component({
  selector: 'app-repuestos',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchSelectorComponent],
  templateUrl: './repuestos.component.html',
  styleUrls: ['./repuestos.component.css']
})
export class RepuestosComponent implements OnInit, OnDestroy {
  selectedAction: Accion = 'listar';
  
  @ViewChild('ProveedorSelector', { static: false })
  searchSelectorProveedor?: SearchSelectorComponent;
  
  @ViewChild('RepuestoSelector', { static: false })
  searchSelectorComponent?: SearchSelectorComponent;

  repuestosAll: Repuesto[] = [];
  repuestos: Repuesto[] = [];
  mostrarModalCompra = false;

  page = 1;
  perPage = 15;
  lastPage = false;
  loading = false;

  // BÚSQUEDA GLOBAL
  private searchSub?: Subscription;
  searchTerm = '';

  // EDICIÓN INLINE
  editingId: number | null = null;
  editBuffer: Partial<Repuesto> = {
    nombre: '',
    stock: 0,
    costo_base: 0
  };

  // CAMPOS PARA COMPRA
  modoCompra: 'nuevo' | 'existente' = 'nuevo';
  repuestoExistenteSeleccionado: SearchResult | null = null;
  repuestosSugeridos: SearchResult[] = [];
  buscandoRepuestos = false;
  proveedorSeleccionado: SearchResult | null = null;
  proveedoresSugeridos: SearchResult[] = [];
  buscandoProveedores = false;

  nuevo = {
    nombre: '',
    cantidad: 1,
    costo_base: 0,
    descripcion: '',
    proveedor: '' 
  };

  constructor(
    private repuestoService: RepuestoService,
    private proveedoresService: ProveedoresService,
    public searchService: SearchService,
    private cdRef: ChangeDetectorRef,
    private alertService: AlertService
  ) { }

  // LIFECYCLE HOOKS
  ngOnInit(): void {
    this.resetLista();
    this.configurarBusqueda();
    window.addEventListener('scroll', this.onScroll);
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    this.searchSub?.unsubscribe();
    this.searchService.clearSearch();
  }

  // CONFIGURACIÓN DE BÚSQUEDA
  configurarBusqueda() {
    this.searchService.setCurrentComponent('repuestos');
    this.searchSub = this.searchService.searchTerm$.subscribe(term => {
      const newTerm = (term || '').trim();

      if (this.searchTerm !== newTerm) {
        this.searchTerm = newTerm;
        this.page = 1;
        this.lastPage = false;
        this.repuestosAll = [];

        if (!this.searchTerm) {
          this.fetch(1);
        } else {
          this.fetch(1);
        }
      }
    });
  }

  // LISTA / PAGINACIÓN
  private fetch(page = 1): void {
    if (this.loading || this.lastPage) return;
    this.loading = true;

    this.repuestoService.getRepuestos(page, this.perPage, this.searchTerm).subscribe({
      next: (res: PaginatedResponse<Repuesto>) => {
        const batch = res.data ?? [];

        if (page === 1) {
          this.repuestosAll = batch;
        } else {
          this.repuestosAll = [...this.repuestosAll, ...batch];
        }

        this.page = res.current_page ?? page;
        this.lastPage = res.last_page === 0 || (res.current_page ?? page) >= (res.last_page ?? page);

        this.repuestos = [...this.repuestosAll];
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.alertService.showGenericError('Error al cargar los repuestos');
      }
    });
  }

  cargar(): void {
    this.fetch(this.page === 0 ? 1 : this.page);
  }

  onScroll = () => {
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 120;
    if (nearBottom && !this.loading && !this.lastPage) {
      this.fetch(this.page + 1);
    }
  };

  resetLista(): void {
    this.page = 1;
    this.lastPage = false;
    this.repuestosAll = [];
    this.repuestos = [];
    this.fetch(1);
  }

  // COMPRAR REPUESTO - CORREGIDO (SOLO UN ALERT)
  comprar(): void {
    let nombreRepuesto = '';
    let repuestoId: number | undefined;
    
    if (this.modoCompra === 'existente' && this.repuestoExistenteSeleccionado) {
      nombreRepuesto = this.repuestoExistenteSeleccionado.nombre || '';
      repuestoId = this.repuestoExistenteSeleccionado.id;
    } else {
      nombreRepuesto = this.nuevo.nombre || '';
    }

    if (!nombreRepuesto.trim()) {
      this.alertService.showError('Error', 'Completá el nombre del repuesto.');
      return;
    }
    
    if (!this.nuevo.cantidad || this.nuevo.cantidad <= 0) {
      this.alertService.showError('Error', 'La cantidad debe ser mayor a 0.');
      return;
    }
    
    if (this.nuevo.costo_base === undefined || this.nuevo.costo_base < 0) {
      this.alertService.showError('Error', 'El costo base no puede ser negativo.');
      return;
    }

    const payload: any = {
      nombre: nombreRepuesto.trim(),
      cantidad: Number(this.nuevo.cantidad) || 0,
      costo_base: Number(this.nuevo.costo_base) || 0,
      descripcion: (this.nuevo.descripcion || '').trim()
    };

    if (this.proveedorSeleccionado) {
      payload.proveedor = this.proveedorSeleccionado.nombre || this.proveedorSeleccionado.razon_social || '';
      payload.proveedor_id = this.proveedorSeleccionado.id;
    } else if (this.nuevo.proveedor && this.nuevo.proveedor.trim()) {
      payload.proveedor = this.nuevo.proveedor.trim();
    }

    if (repuestoId) {
      payload.repuesto_id = repuestoId;
    }

    console.log('Enviando compra:', payload);

    this.alertService.showLoading('Realizando compra...');

    this.repuestoService.comprarRepuesto(payload).subscribe({
      next: (response: any) => {
        this.alertService.closeLoading();
        console.log('Respuesta de compra:', response);

        this.resetFormularioCompra();
        this.resetLista();
        
        // SOLO UN ALERT - CORREGIDO
        const repuestoNombre = response.repuesto?.nombre || nombreRepuesto;
        this.alertService.showRepuestoCreado(repuestoNombre);
      },
      error: (e) => {
        this.alertService.closeLoading();
        this.manejarErrorSweetAlert(e, 'realizar la compra');
      }
    });
  }

  // BÚSQUEDA DE PROVEEDORES
  buscarProveedores(termino: string): void {
    if (!termino || termino.length < 2) {
      this.proveedoresSugeridos = [];
      if (this.searchSelectorProveedor) {
        this.searchSelectorProveedor.updateSuggestions([]);
      }
      return;
    }

    this.buscandoProveedores = true;
    
    this.proveedoresService.buscarProveedoresRapido(termino).subscribe({
      next: (proveedores) => {
        this.proveedoresSugeridos = proveedores.map(prov => 
          this.proveedorToSearchResult(prov)
        );
        
        if (this.searchSelectorProveedor) {
          this.searchSelectorProveedor.updateSuggestions(this.proveedoresSugeridos);
        }
        
        this.buscandoProveedores = false;
      },
      error: (error) => {
        this.buscandoProveedores = false;
        this.proveedoresSugeridos = [];
        
        if (this.searchSelectorProveedor) {
          this.searchSelectorProveedor.updateSuggestions([]);
        }
      }
    });
  }

  // BÚSQUEDA DE REPUESTOS EXISTENTES
  buscarRepuestosExistentes(termino: string): void {
    if (!termino || termino.length < 2) {
      this.repuestosSugeridos = [];
      if (this.searchSelectorComponent) {
        this.searchSelectorComponent.updateSuggestions([]);
      }
      return;
    }

    this.buscandoRepuestos = true;
    
    this.repuestoService.buscarRepuestos(termino).subscribe({
      next: (response: any) => {
        const repuestos = response?.data || [];
        
        this.repuestosSugeridos = repuestos.map((rep: any) => 
          this.repuestoToSearchResult(rep)
        );
        
        if (this.searchSelectorComponent) {
          this.searchSelectorComponent.updateSuggestions(this.repuestosSugeridos);
        }
        
        this.buscandoRepuestos = false;
      },
      error: (error) => {
        this.buscandoRepuestos = false;
        this.repuestosSugeridos = [];
        
        if (this.searchSelectorComponent) {
          this.searchSelectorComponent.updateSuggestions([]);
        }
      }
    });
  }

  // ====== CONVERSIÓN DE DATOS A SEARCHRESULT ======
  
  private proveedorToSearchResult(proveedor: Proveedor): SearchResult {
    return {
      id: proveedor.id!,
      nombre: proveedor.nombre || proveedor.razon_social,
      razon_social: proveedor.razon_social,
      cuit: proveedor.cuit,
      telefono: proveedor.telefono,
      email: proveedor.email,
      direccion: proveedor.direccion,
      tipo: 'proveedor'
    };
  }

  private repuestoToSearchResult(repuesto: any): SearchResult {
    if (!repuesto) {
      return {
        id: 0,
        nombre: 'Sin nombre',
        stock: 0,
        costo_base: 0,
        costo_actual: 0,
        tipo: 'repuesto'
      };
    }
    
    return {
      id: repuesto.id || 0,
      nombre: repuesto.nombre || 'Sin nombre',
      stock: repuesto.stock || 0,
      costo_base: repuesto.costo_base || 0,
      costo_actual: repuesto.costo_base || 0,
      tipo: 'repuesto'
    };
  }

  // MANEJO DE SELECCIONES DEL SEARCH-SELECTOR
  seleccionarProveedor(proveedor: SearchResult): void {
    this.proveedorSeleccionado = proveedor;
  }

  limpiarProveedor(): void {
    this.proveedorSeleccionado = null;
  }

  seleccionarRepuestoExistente(repuesto: SearchResult): void {
    this.repuestoExistenteSeleccionado = repuesto;
    this.nuevo.costo_base = repuesto.costo_actual || repuesto.costo_base || 0;
  }

  limpiarRepuestoExistente(): void {
    this.repuestoExistenteSeleccionado = null;
    this.nuevo.costo_base = 0;
  }

  // CAMBIAR MODO DE COMPRA
  cambiarModoCompra(modo: 'nuevo' | 'existente'): void {
    this.modoCompra = modo;
    
    if (modo === 'nuevo') {
      this.limpiarRepuestoExistente();
      this.nuevo.nombre = '';
    } else {
      if (!this.repuestoExistenteSeleccionado) {
        this.nuevo.nombre = '';
      }
    }
  }

  // RESETEAR FORMULARIO DE COMPRA
  private resetFormularioCompra(): void {
    this.selectedAction = 'listar';
    this.modoCompra = 'nuevo';
    this.repuestoExistenteSeleccionado = null;
    this.proveedorSeleccionado = null;
    
    this.nuevo = {
      nombre: '',
      cantidad: 1,
      costo_base: 0,
      descripcion: '',
      proveedor: ''
    };
    
    this.repuestosSugeridos = [];
    this.proveedoresSugeridos = [];
  }

  // ====== ELIMINAR REPUESTO ======
  async eliminar(id: number): Promise<void> {
    const repuesto = this.repuestosAll.find(x => x.id === id);
    const repuestoNombre = repuesto?.nombre || `Repuesto #${id}`;
    
    const confirmed = await this.alertService.confirmDeleteRepuesto(repuestoNombre);
    if (!confirmed) return;

    this.alertService.showLoading('Eliminando repuesto...');

    this.repuestoService.deleteRepuesto(id).subscribe({
      next: () => {
        this.alertService.closeLoading();
        
        this.repuestosAll = this.repuestosAll.filter(x => x.id !== id);
        this.repuestos = this.repuestos.filter(x => x.id !== id);
        this.searchService.setSearchData(this.repuestosAll);
        
        this.alertService.showRepuestoEliminado(repuestoNombre);
      },
      error: (e) => {
        this.alertService.closeLoading();
        this.manejarErrorSweetAlert(e, 'eliminar el repuesto');
      }
    });
  }

  // EDICIÓN INLINE
  startEdit(item: Repuesto): void {
    this.editingId = item.id!;
    this.editBuffer = {
      nombre: item.nombre ?? '',
      stock: item.stock ?? 0,
      costo_base: item.costo_base ?? 0
    };
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editBuffer = {};
  }

  async saveEdit(id: number): Promise<void> {
    const payload = this.limpiarPayload(this.editBuffer);
    if (!this.validarPayload(payload)) return;

    console.log('Actualizando repuesto:', id, payload);

    this.alertService.showLoading('Actualizando repuesto...');

    this.repuestoService.updateRepuesto(id, payload).subscribe({
      next: (response: any) => {
        this.alertService.closeLoading();
        console.log('Respuesta de actualización:', response);

        const repuestoActualizado = response.repuesto || response.data || response;

        const updateLocal = (arr: Repuesto[]) => {
          const idx = arr.findIndex(x => x.id === id);
          if (idx >= 0) {
            arr[idx] = {
              ...arr[idx],
              ...repuestoActualizado
            } as Repuesto;
          }
        };

        updateLocal(this.repuestosAll);
        updateLocal(this.repuestos);

        this.searchService.setSearchData(this.repuestosAll);
        this.cancelEdit();
        
        const repuestoNombre = payload.nombre || this.repuestosAll.find(x => x.id === id)?.nombre || 'Repuesto';
        this.alertService.showRepuestoActualizado(repuestoNombre);
      },
      error: (e) => {
        this.alertService.closeLoading();
        this.manejarErrorSweetAlert(e, 'actualizar el repuesto');
      }
    });
  }

  // HELPERS - MANTENIDOS (SOLO UNO DE CADA)
  private limpiarPayload(obj: Partial<Repuesto>): Partial<Repuesto> {
    return {
      nombre: obj.nombre?.toString().trim(),
      stock: Number(obj.stock) || 0,
      costo_base: Number(obj.costo_base) || 0
    };
  }

  private validarPayload(p: any): boolean {
    if (!p.nombre || p.nombre.trim() === '') {
      this.alertService.showValidationError('nombre del repuesto');
      return false;
    }
    if (p.stock === null || p.stock === undefined || p.stock < 0) {
      this.alertService.showError('Error', 'El stock no puede ser negativo.');
      return false;
    }
    if (p.costo_base === null || p.costo_base === undefined || p.costo_base < 0) {
      this.alertService.showError('Error', 'El costo base no puede ser negativo.');
      return false;
    }
    return true;
  }

  private manejarErrorSweetAlert(error: any, operacion: string): void {
    let mensajeError = `Error al ${operacion}`;

    if (error.error?.error) {
      mensajeError = error.error.error;
    } else if (error.error?.message) {
      mensajeError = error.error.message;
    } else if (error.message) {
      mensajeError = error.message;
    }

    this.alertService.showError('Error', mensajeError);
  }

  // UTILITIES
  getStockClass(stock: number): string {
    if (stock === 0) {
      return 'text-danger fw-bold';
    } else if (stock <= 10) {
      return 'text-warning fw-semibold';
    } else {
      return 'text-success';
    }
  }
  
  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(precio);
  }

  seleccionarAccion(a: Accion) {
    this.selectedAction = a;
    if (a === 'comprar') {
      this.resetFormularioCompra();
      this.selectedAction = 'comprar';
    }
  }

  limpiarBusqueda() {
    this.searchTerm = '';
    this.searchService.setSearchTerm('');
    this.page = 1;
    this.lastPage = false;
    this.repuestosAll = [];
    this.repuestos = [];

    this.fetch(1);
  }

  // MÉTODOS PARA TEMPLATE
  getInfoRepuestoSeleccionado(): string {
    if (!this.repuestoExistenteSeleccionado) return '';
    
    const repuesto = this.repuestoExistenteSeleccionado;
    const stock = repuesto.stock !== undefined ? `Stock: ${repuesto.stock}` : '';
    const costo = repuesto.costo_actual ? `Costo: ${this.formatearPrecio(repuesto.costo_actual)}` : 
                repuesto.costo_base ? `Costo: ${this.formatearPrecio(repuesto.costo_base)}` : '';
    
    return [stock, costo].filter(Boolean).join(' | ');
  }

  getInfoProveedorSeleccionado(): string {
    if (!this.proveedorSeleccionado) return '';
    
    const proveedor = this.proveedorSeleccionado;
    const cuit = proveedor.cuit ? `CUIT: ${proveedor.cuit}` : '';
    const telefono = proveedor.telefono ? `Tel: ${proveedor.telefono}` : '';
    const email = proveedor.email ? `Email: ${proveedor.email}` : '';
    
    return [cuit, telefono, email].filter(Boolean).join(' | ');
  }

  esFormularioCompraValido(): boolean {
    let nombreValido = false;
    
    if (this.modoCompra === 'existente') {
      nombreValido = !!this.repuestoExistenteSeleccionado;
    } else {
      nombreValido = !!(this.nuevo.nombre && this.nuevo.nombre.trim() !== '');
    }
    
    const cantidadValida = !!(this.nuevo.cantidad && this.nuevo.cantidad > 0);
    const costoValido = !!(this.nuevo.costo_base !== undefined && this.nuevo.costo_base >= 0);
    
    return nombreValido && cantidadValida && costoValido;
  }

  // Método para detectar cambios en la vista
  ngAfterViewInit() {
    this.cdRef.detectChanges();
  }
}