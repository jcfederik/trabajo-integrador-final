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
  selectedAction: Accion = 'listar';
  
  proveedoresAll: ProveedorUI[] = [];
  proveedores: ProveedorUI[] = [];

  emailInvalido = false;
  emailEditInvalido = false;

  page = 1;
  perPage = 15;
  lastPage = false;
  loading = false;

  private searchSub?: Subscription;
  searchTerm = '';

  editingId: number | null = null;
  editBuffer: Partial<ProveedorUI> = {
    razon_social: '',
    cuit: '',
    telefono: '',
    direccion: '',
    email: ''
  };

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

  // LIFECYCLE
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

  // VALIDACIÓN DE EMAIL
  private readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  validarEmailCreacion(): void {
    if (!this.nuevo.email) {
      this.emailInvalido = false;
      return;
    }
    
    this.emailInvalido = !this.EMAIL_REGEX.test(this.nuevo.email);
    
    if (this.emailInvalido) {
      this.alertService.showInvalidEmailError();
    }
  }

  validarEmailEdicion(): void {
    if (!this.editBuffer.email) {
      this.emailEditInvalido = false;
      return;
    }
    
    this.emailEditInvalido = !this.EMAIL_REGEX.test(this.editBuffer.email);
    
    if (this.emailEditInvalido) {
      this.alertService.showInvalidEmailError();
    }
  }

  private esEmailValido(email: string): boolean {
    if (!email || email.trim() === '') {
      return true;
    }
    return this.EMAIL_REGEX.test(email.trim());
  }

  // MÉTODOS PARA VALIDACIÓN DE INPUTS NUMÉRICOS
  soloNumeros(event: KeyboardEvent): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    
    if ([8, 9, 13, 27, 46].includes(charCode)) {
      return true;
    }
    
    if (event.ctrlKey && [65, 67, 86, 88].includes(charCode)) {
      return true;
    }
    
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    }
    
    return true;
  }

  limitarLongitud(campo: 'cuit' | 'telefono', event: Event): void {
    const input = event.target as HTMLInputElement;
    const valor = input.value;
    
    if (valor.length > 11) {
      input.value = valor.substring(0, 11);
      
      if (campo === 'cuit') {
        if (this.editingId) {
          this.editBuffer.cuit = input.value;
        } else {
          this.nuevo.cuit = input.value;
        }
      } else if (campo === 'telefono') {
        if (this.editingId) {
          this.editBuffer.telefono = input.value;
        } else {
          this.nuevo.telefono = input.value;
        }
      }
    }
  }

  // CONFIGURACIÓN DE BÚSQUEDA
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

  // CARGA Y PAGINACIÓN
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

  // NAVEGACIÓN
  seleccionarAccion(a: Accion) { 
    this.selectedAction = a; 
  }

  limpiarBusqueda() {
    this.searchService.setSearchTerm('');
  }

  // CREACIÓN
  async crear(): Promise<void> {
    if (this.nuevo.email && !this.esEmailValido(this.nuevo.email)) {
      this.emailInvalido = true;
      this.alertService.showInvalidEmailError();
      return;
    }

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
        this.emailInvalido = false;
        this.resetLista();
        this.alertService.showProveedorCreado(payload.razon_social!);
      },
      error: (e) => {
        this.alertService.closeLoading();
        this.alertService.showGenericError('Error al crear proveedor');
      }
    });
  }

  // ELIMINACIÓN
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

  // EDICIÓN INLINE
  startEdit(item: ProveedorUI): void {
    this.editingId = item.id!;
    this.editBuffer = {
      razon_social: item.razon_social ?? '',
      cuit: (item.cuit ?? '').toString().replace(/\D/g, ''),
      telefono: (item.telefono ?? '').toString().replace(/\D/g, ''),
      direccion: item.direccion ?? '',
      email: item.email ?? ''
    };
    this.emailEditInvalido = false;
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editBuffer = {};
    this.emailEditInvalido = false;
  }

  async saveEdit(id: number): Promise<void> {
    if (this.editBuffer.email && !this.esEmailValido(this.editBuffer.email)) {
      this.emailEditInvalido = true;
      this.alertService.showInvalidEmailError();
      return;
    }

    const payload = this.limpiarPayload(this.editBuffer);
    if (!this.validarPayload(payload)) return;

    this.alertService.showLoading('Actualizando proveedor...');

    this.proveedoresService.updateProveedor(id, payload).subscribe({
      next: (response: any) => {
        this.alertService.closeLoading();
        this.resetLista();
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

  // VALIDACIÓN Y UTILIDADES
  private limpiarPayload(obj: Partial<ProveedorUI>): Partial<ProveedorUI> {
    const sanitized = {
      cuit: obj.cuit?.toString().replace(/\D/g, '').substring(0, 11),
      telefono: obj.telefono?.toString().replace(/\D/g, '').substring(0, 11)
    };
    
    return {
      razon_social: obj.razon_social?.toString().trim(),
      cuit: sanitized.cuit?.trim(),
      telefono: sanitized.telefono?.trim(),
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
    
    const cuitNumerico = p.cuit.replace(/\D/g, '');
    if (cuitNumerico.length < 11) {
      this.alertService.showError('CUIT inválido', 'El CUIT debe tener 11 dígitos');
      return false;
    }
    
    return true;
  }

  formatearTelefono(telefono: string | undefined): string {
    if (!telefono) return 'No especificado';
    return telefono;
  }
}