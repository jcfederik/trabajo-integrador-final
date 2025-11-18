import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProveedoresService, Proveedor, PaginatedResponse } from '../../services/proveedores.service';
import { SearchService } from '../../services/busquedaglobal';

type Accion = 'listar' | 'crear';
type ProveedorUI = Proveedor;

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule ],
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.css']
})
export class ProveedoresComponent implements OnInit, OnDestroy {
  selectedAction: Accion = 'listar';
  
  proveedoresAll: ProveedorUI[] = [];
  proveedores: ProveedorUI[] = [];

  page = 1;
  perPage = 15;
  lastPage = false;
  loading = false;

  // Búsqueda global
  private searchSub?: Subscription;
  searchTerm = '';

  // Edición inline
  editingId: number | null = null;
  editBuffer: Partial<ProveedorUI> = {
    razon_social: '',
    cuit: '',
    telefono: '',
    direccion: '',
    email: ''
  };

  // Creación
  nuevo: Partial<ProveedorUI> = {
    razon_social: '',
    cuit: '',
    telefono: '',
    direccion: '',
    email: ''
  };

  constructor(
    private proveedoresService: ProveedoresService,
    private searchService: SearchService
  ) {}

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

  // ====== CONFIGURACIÓN DE BÚSQUEDA ======
  configurarBusqueda() {
    this.searchService.setCurrentComponent('proveedores');
    this.searchSub = this.searchService.searchTerm$.subscribe(term => {
      this.searchTerm = (term || '').trim();
      this.applyFilter();
    });
  }

  // ====== LISTA / PAGINACIÓN ======
  private fetch(page = 1): void {
    if (this.loading || this.lastPage) return;
    this.loading = true;

    this.proveedoresService.getProveedores(page, this.perPage).subscribe({
      next: (res: PaginatedResponse<Proveedor>) => {
        const batch = res.data ?? [];

        if (page === 1) {
          this.proveedoresAll = batch;
        } else {
          this.proveedoresAll = [...this.proveedoresAll, ...batch];
        }

        this.page = res.current_page ?? page;
        this.lastPage = res.last_page === 0 || (res.current_page ?? page) >= (res.last_page ?? page);

        this.applyFilter();
        this.searchService.setSearchData(this.proveedoresAll);
        this.loading = false;
      },
      error: (e) => {
        console.error('Error al obtener proveedores', e);
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
    this.proveedoresAll = [];
    this.proveedores = [];
    this.fetch(1);
  }

  private applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    if (!term) {
      this.proveedores = [...this.proveedoresAll];
      return;
    }

    this.proveedores = this.proveedoresAll.filter(p =>
      p.razon_social.toLowerCase().includes(term) ||
      p.cuit.toLowerCase().includes(term) ||
      (p.telefono?.toLowerCase().includes(term) ?? false) ||
      (p.direccion?.toLowerCase().includes(term) ?? false) ||
      (p.email?.toLowerCase().includes(term) ?? false)
    );
  }

  // ====== CREAR PROVEEDOR ======
  crear(): void {
    const payload = this.limpiarPayload(this.nuevo);
    if (!this.validarPayload(payload)) return;

    this.proveedoresService.createProveedor(payload).subscribe({
      next: (response: any) => {
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
        alert('Proveedor creado exitosamente!');
      },
      error: (e) => {
        console.error('Error al crear proveedor', e);
        alert(e?.error?.error ?? 'Error al crear proveedor');
      }
    });
  }

  // ====== ELIMINAR PROVEEDOR ======
  eliminar(id: number): void {
    if (!confirm('¿Eliminar este proveedor?')) return;

    this.proveedoresService.deleteProveedor(id).subscribe({
      next: () => {
        this.proveedoresAll = this.proveedoresAll.filter(x => x.id !== id);
        this.applyFilter();
        this.searchService.setSearchData(this.proveedoresAll);
        alert('Proveedor eliminado exitosamente!');
      },
      error: (e) => { 
        console.error('Error al eliminar proveedor', e);
        alert('Error al eliminar el proveedor');
      }
    });
  }

  // ====== EDICIÓN INLINE ======
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

  saveEdit(id: number): void {
    const payload = this.limpiarPayload(this.editBuffer);
    if (!this.validarPayload(payload)) return;

    this.proveedoresService.updateProveedor(id, payload).subscribe({
      next: (response: any) => {
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
        alert('Proveedor actualizado exitosamente!');
      },
      error: (e) => {
        console.error('Error al actualizar proveedor', e);
        alert(e?.error?.error ?? 'No se pudo actualizar el proveedor');
      }
    });
  }

  // ====== HELPERS ======
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
      alert('Completá la razón social del proveedor.');
      return false;
    }
    if (!p.cuit || p.cuit.trim() === '') {
      alert('Completá el CUIT del proveedor.');
      return false;
    }
    return true;
  }

  formatearTelefono(telefono: string | undefined): string {
    if (!telefono) return 'No especificado';
    return telefono;
  }

  seleccionarAccion(a: Accion) { 
    this.selectedAction = a; 
  }

  limpiarBusqueda() {
    this.searchService.clearSearch();
  }
}