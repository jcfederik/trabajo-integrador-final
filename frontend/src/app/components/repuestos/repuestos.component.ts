import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { RepuestoService, Repuesto, PaginatedResponse } from '../../services/repuestos.service';
import { SearchService } from '../../services/busquedaglobal';

type Accion = 'listar' | 'crear';

@Component({
  selector: 'app-repuestos',
  standalone: true,
  imports: [CommonModule, FormsModule], // ← Quitamos SearchSelectorComponent
  templateUrl: './repuestos.component.html',
  styleUrls: ['./repuestos.component.css']
})
export class RepuestosComponent implements OnInit, OnDestroy {
  selectedAction: Accion = 'listar';

  repuestosAll: Repuesto[] = [];
  repuestos: Repuesto[] = [];

  page = 1;
  perPage = 15;
  lastPage = false;
  loading = false;

  // Búsqueda global
  private searchSub?: Subscription;
  searchTerm = '';

  // Edición inline
  editingId: number | null = null;
  editBuffer: Partial<Repuesto> = {
    nombre: '',
    stock: 0,
    costo_base: 0
  };

  // Creación
  nuevo: Partial<Repuesto> = {
    nombre: '',
    stock: 0,
    costo_base: 0
  };

  constructor(
    private repuestoService: RepuestoService,
    public searchService: SearchService
  ) {}

  // ====== LIFECYCLE ======
  ngOnInit(): void {
    this.resetLista();
    this.configurarBusqueda();
    window.addEventListener('scroll', this.onScroll, { passive: true });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    this.searchSub?.unsubscribe();
    this.searchService.clearSearch();
  }

  // ====== CONFIGURACIÓN ======
  configurarBusqueda() {
    this.searchService.setCurrentComponent('repuestos');
    this.searchSub = this.searchService.searchTerm$.subscribe(term => {
      this.searchTerm = (term || '').trim();
      this.applyFilter();
    });
  }

  seleccionarAccion(a: Accion) { 
    this.selectedAction = a; 
  }

  limpiarBusqueda() {
    this.searchService.clearSearch();
  }

  // ====== LISTA / PAGINACIÓN ======
  private fetch(page = 1): void {
    if (this.loading || this.lastPage) return;
    this.loading = true;

    this.repuestoService.getRepuestos(page, this.perPage).subscribe({
      next: (res: PaginatedResponse<Repuesto>) => {
        const batch = res.data ?? [];

        if (page === 1) {
          this.repuestosAll = batch;
        } else {
          this.repuestosAll = [...this.repuestosAll, ...batch];
        }

        this.page = res.current_page ?? page;
        this.lastPage = res.last_page === 0 || (res.current_page ?? page) >= (res.last_page ?? page);

        this.applyFilter();
        this.searchService.setSearchData(this.repuestosAll);
        this.loading = false;
      },
      error: (e) => {
        console.error('Error al obtener repuestos', e);
        this.loading = false;
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

  private applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    if (!term) {
      this.repuestos = [...this.repuestosAll];
      return;
    }

    this.repuestos = this.searchService.search(this.repuestosAll, term, 'repuestos');
  }

  // ====== CRUD OPERATIONS ======
  crear(): void {
    const payload = this.limpiarPayload(this.nuevo);
    if (!this.validarPayload(payload)) return;

    console.log('Enviando payload:', payload);

    this.repuestoService.createRepuesto(payload).subscribe({
      next: (response: any) => {
        console.log('Respuesta del servidor:', response);
        
        const nuevoRepuesto = response.repuesto || response.data || response;
        
        this.selectedAction = 'listar';
        this.nuevo = { nombre: '', stock: 0, costo_base: 0 };
        this.resetLista();
        alert('Repuesto creado exitosamente!');
      },
      error: (e) => {
        this.manejarError(e, 'crear repuesto');
      }
    });
  }

  eliminar(id: number): void {
    if (!confirm('¿Eliminar este repuesto?')) return;

    this.repuestoService.deleteRepuesto(id).subscribe({
      next: () => {
        this.repuestosAll = this.repuestosAll.filter(x => x.id !== id);
        this.applyFilter();
        this.searchService.setSearchData(this.repuestosAll);
        alert('Repuesto eliminado exitosamente!');
      },
      error: (e) => { 
        console.error('Error al eliminar repuesto', e);
        alert('Error al eliminar el repuesto');
      }
    });
  }

  // ====== EDICIÓN INLINE ======
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

  saveEdit(id: number): void {
    const payload = this.limpiarPayload(this.editBuffer);
    if (!this.validarPayload(payload)) return;

    console.log('Actualizando repuesto:', id, payload);

    this.repuestoService.updateRepuesto(id, payload).subscribe({
      next: (response: any) => {
        console.log('Respuesta de actualización:', response);
        
        const repuestoActualizado = response.repuesto || response.data || response;
        this.actualizarRepuestoLocal(id, repuestoActualizado);
        this.cancelEdit();
        alert('Repuesto actualizado exitosamente!');
      },
      error: (e) => {
        this.manejarError(e, 'actualizar repuesto');
      }
    });
  }

  // ====== HELPERS ======
  private limpiarPayload(obj: Partial<Repuesto>): Partial<Repuesto> {
    return {
      nombre: obj.nombre?.toString().trim(),
      stock: Number(obj.stock) || 0,
      costo_base: Number(obj.costo_base) || 0
    };
  }

  private validarPayload(p: any): boolean {
    if (!p.nombre || p.nombre.trim() === '') {
      alert('Completá el nombre del repuesto.');
      return false;
    }
    if (p.stock === null || p.stock === undefined || p.stock < 0) {
      alert('El stock no puede ser negativo.');
      return false;
    }
    if (p.costo_base === null || p.costo_base === undefined || p.costo_base < 0) {
      alert('El costo base no puede ser negativo.');
      return false;
    }
    return true;
  }

  private actualizarRepuestoLocal(id: number, datosActualizados: Partial<Repuesto>): void {
    const actualizarArray = (arr: Repuesto[]) => {
      const idx = arr.findIndex(x => x.id === id);
      if (idx >= 0) {
        arr[idx] = { 
          ...arr[idx], 
          ...datosActualizados 
        } as Repuesto;
      }
    };

    actualizarArray(this.repuestosAll);
    actualizarArray(this.repuestos);
    this.searchService.setSearchData(this.repuestosAll);
  }

  private manejarError(error: any, operacion: string): void {
    console.error(`Error completo al ${operacion}:`, error);
    
    let mensajeError = `Error al ${operacion}`;
    
    if (error.error?.error) {
      mensajeError = error.error.error;
    } else if (error.error?.message) {
      mensajeError = error.error.message;
    } else if (error.message) {
      mensajeError = error.message;
    }
    
    alert(mensajeError);
  }

  // ====== UTILITIES ======
  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(precio);
  }

  getStockClass(stock: number): string {
    if (stock === 0) return 'text-danger';
    if (stock < 10) return 'text-warning';
    return '';
  }
}