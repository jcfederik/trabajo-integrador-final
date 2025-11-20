import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProveedoresService, Proveedor, PaginatedResponse } from '../../services/proveedores.service';
import { SearchService } from '../../services/busquedaglobal';
import { AlertService } from '../../services/alert.service';

type Accion = 'listar' | 'crear';
type ProveedorUI = Proveedor;

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.css']
})
export class ProveedoresComponent implements OnInit, OnDestroy {

  // =============== ESTADOS DEL COMPONENTE ===============
  selectedAction: Accion = 'listar';
  
  proveedoresAll: ProveedorUI[] = [];
  proveedores: ProveedorUI[] = [];

  // =============== PAGINACIÓN ===============
  page = 1;
  perPage = 15;
  lastPage = false;
  loading = false;

  // =============== BÚSQUEDA GLOBAL ===============
  private searchSub?: Subscription;
  searchTerm = '';

  // =============== EDICIÓN ===============
  editingId: number | null = null;
  editBuffer: Partial<ProveedorUI> = {
    razon_social: '',
    cuit: '',
    telefono: '',
    direccion: '',
    email: ''
  };

  // =============== CREACIÓN ===============
  nuevo: Partial<ProveedorUI> = {
    razon_social: '',
    cuit: '',
    telefono: '',
    direccion: '',
    email: ''
  };

  constructor(
    private proveedoresService: ProveedoresService,
    private searchService: SearchService,
    private alertService: AlertService
  ) {}

  // =============== LIFECYCLE ===============
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

  // =============== CONFIGURACIÓN DE BÚSQUEDA ===============
  configurarBusqueda() {
    this.searchService.setCurrentComponent('proveedores');
    this.searchSub = this.searchService.searchTerm$.subscribe(term => {
      this.searchTerm = (term || '').trim();
      this.page = 1;
      this.lastPage = false;
      this.proveedoresAll = [];
      this.cargar();
    });
  }

  // =============== CARGA Y PAGINACIÓN ===============
  private fetch(page = 1): void {
    if (this.loading || this.lastPage) return;
    this.loading = true;

    this.proveedoresService.getProveedores(page, this.perPage, this.searchTerm).subscribe({
      next: (res: PaginatedResponse<Proveedor>) => {
        const batch = res.data ?? [];

        if (page === 1) {
          this.proveedoresAll = batch;
        } else {
          this.proveedoresAll = [...this.proveedoresAll, ...batch];
        }

        this.page = res.current_page ?? page;
        this.lastPage = res.last_page === 0 || (res.current_page ?? page) >= (res.last_page ?? page);

        this.proveedores = [...this.proveedoresAll];
        this.searchService.setSearchData(this.proveedoresAll);
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.alertService.showGenericError('Error al cargar los proveedores');
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
    this.proveedoresAll = [];
    this.proveedores = [];
    this.fetch(1);
  }

  // =============== NAVEGACIÓN ===============
  seleccionarAccion(a: Accion) { 
    this.selectedAction = a; 
  }

  limpiarBusqueda() {
    this.searchService.clearSearch();
  }

  // =============== CREACIÓN ===============
  async crear(): Promise<void> {
    const payload = this.limpiarPayload(this.nuevo);
    if (!this.validarPayload(payload)) return;

    this.alertService.showLoading('Creando proveedor...');

    this.proveedoresService.createProveedor(payload).subscribe({
      next: (response: any) => {
        this.alertService.closeLoading();
        const nuevoProveedor = response.proveedor || response;
        this.selectedAction = 'listar';
        this.nuevo = { 
          razon_social: '', 
          cuit: '', 
          telefono: '', 
          direccion: '', 
          email: '' 
        };
        this.resetLista();
        this.alertService.showProveedorCreado(payload.razon_social!);
      },
      error: (e) => {
        this.alertService.closeLoading();
        this.alertService.showGenericError('Error al crear proveedor');
      }
    });
  }

  // =============== ELIMINACIÓN ===============
  async eliminar(id: number): Promise<void> {
    const proveedor = this.proveedoresAll.find(p => p.id === id);
    const confirmed = await this.alertService.confirmDeleteProveedor(proveedor?.razon_social || 'este proveedor');
    if (!confirmed) return;

    this.alertService.showLoading('Eliminando proveedor...');

    this.proveedoresService.deleteProveedor(id).subscribe({
      next: () => {
        this.alertService.closeLoading();
        this.proveedoresAll = this.proveedoresAll.filter(x => x.id !== id);
        this.proveedores = this.proveedores.filter(x => x.id !== id);
        this.searchService.setSearchData(this.proveedoresAll);
        this.alertService.showProveedorEliminado(proveedor?.razon_social || 'Proveedor');
      },
      error: (e) => {
        this.alertService.closeLoading();
        this.alertService.showGenericError('Error al eliminar el proveedor');
      }
    });
  }

  // =============== EDICIÓN INLINE ===============
  startEdit(item: ProveedorUI): void {
    this.editingId = item.id!;
    this.editBuffer = {
      razon_social: item.razon_social ?? '',
      cuit: item.cuit ?? '',
      telefono: item.telefono ?? '',
      direccion: item.direccion ?? '',
      email: item.email ?? ''
    };
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editBuffer = {};
  }

  async saveEdit(id: number): Promise<void> {
    const payload = this.limpiarPayload(this.editBuffer);
    if (!this.validarPayload(payload)) return;

    this.alertService.showLoading('Actualizando proveedor...');

    this.proveedoresService.updateProveedor(id, payload).subscribe({
      next: (response: any) => {
        this.alertService.closeLoading();
        const proveedorActualizado = response.proveedor || response;
        
        const updateLocal = (arr: ProveedorUI[]) => {
          const idx = arr.findIndex(x => x.id === id);
          if (idx >= 0) {
            arr[idx] = { 
              ...arr[idx], 
              ...proveedorActualizado 
            } as ProveedorUI;
          }
        };

        updateLocal(this.proveedoresAll);
        updateLocal(this.proveedores);

        this.searchService.setSearchData(this.proveedoresAll);
        this.cancelEdit();
        this.alertService.showProveedorActualizado(payload.razon_social!);
      },
      error: (e) => {
        this.alertService.closeLoading();
        this.alertService.showGenericError('No se pudo actualizar el proveedor');
      }
    });
  }

  // =============== VALIDACIÓN Y UTILIDADES ===============
  private limpiarPayload(obj: Partial<ProveedorUI>): Partial<ProveedorUI> {
    return {
      razon_social: obj.razon_social?.toString().trim(),
      cuit: obj.cuit?.toString().trim(),
      telefono: obj.telefono?.toString().trim(),
      direccion: obj.direccion?.toString().trim(),
      email: obj.email?.toString().trim()
    };
  }

  private validarPayload(p: any): boolean {
    if (!p.razon_social || p.razon_social.trim() === '') {
      this.alertService.showRequiredFieldError('razón social');
      return false;
    }
    if (!p.cuit || p.cuit.trim() === '') {
      this.alertService.showRequiredFieldError('CUIT');
      return false;
    }
    return true;
  }

  formatearTelefono(telefono: string | undefined): string {
    if (!telefono) return 'No especificado';
    return telefono;
  }
}