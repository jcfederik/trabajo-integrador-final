import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SearchService } from '../../services/busquedaglobal';
import { MedioCobroService, MedioCobro, PaginatedResponse } from '../../services/medio-cobro.service';

@Component({
  selector: 'app-medios-cobro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medios-cobro.html',
  styleUrls: ['./medios-cobro.css'],
})
export class MediosCobroComponent implements OnInit, OnDestroy {

  // =============== ESTADOS DEL COMPONENTE ===============
  medios: MedioCobro[] = [];
  filteredMedios: MedioCobro[] = [];
  selectedAction: 'listar' | 'crear' = 'listar';
  loading = false;

  // =============== PAGINACIÓN ===============
  currentPage = 1;
  lastPage = 1;
  perPage = 10;
  total = 0;
  hasMorePages = true;

  // =============== CREACIÓN ===============
  nuevo: Partial<MedioCobro> = { nombre: '' };

  // =============== EDICIÓN ===============
  editingId: number | null = null;
  editBuffer: Partial<MedioCobro> = {};

  private searchSubscription!: Subscription;

  constructor(
    private medioService: MedioCobroService,
    private searchService: SearchService
  ) {}

  // =============== LIFECYCLE ===============
  ngOnInit(): void {
    this.obtenerMedios();
    this.searchService.setCurrentComponent('medios-cobro');

    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.searchSubscription = this.searchService.searchTerm$.subscribe(term => {
      this.filterMedios(term);
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    if (this.searchSubscription) this.searchSubscription.unsubscribe();
    this.searchService.clearSearch();
  }

  // =============== CARGA DE DATOS ===============
  obtenerMedios(page: number = 1): void {
    if (this.loading || !this.hasMorePages) return;
    this.loading = true;

    this.medioService.getMedios(page, this.perPage).subscribe({
      next: (response: PaginatedResponse<MedioCobro>) => {
        if (page === 1) this.medios = response.data;
        else this.medios = [...this.medios, ...response.data];

        this.filteredMedios = [...this.medios];
        this.currentPage = response.current_page;
        this.lastPage = response.last_page;
        this.total = response.total;
        this.hasMorePages = response.current_page < response.last_page;
        this.loading = false;

        this.searchService.setSearchData(this.medios);
      },
      error: (err) => {
        this.loading = false;
      },
    });
  }

  // =============== PAGINACIÓN Y SCROLL ===============
  onScroll = () => {
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
    if (nearBottom && this.hasMorePages && !this.loading) {
      this.obtenerMedios(this.currentPage + 1);
    }
  };

  resetLista() {
    this.currentPage = 1;
    this.hasMorePages = true;
    this.obtenerMedios(1);
  }

  // =============== BÚSQUEDA Y FILTRADO ===============
  filterMedios(term: string) {
    if (!term) {
      this.filteredMedios = [...this.medios];
      return;
    }
    this.filteredMedios = this.searchService.search(this.medios, term, 'medios-cobro');
  }

  // =============== NAVEGACIÓN ===============
  seleccionarAccion(a: 'listar' | 'crear') {
    this.selectedAction = a;
  }

  // =============== CREACIÓN ===============
  crear() {
    if (!this.nuevo.nombre?.trim()) {
      alert('Debe ingresar un nombre');
      return;
    }

    this.medioService.createMedio(this.nuevo).subscribe({
      next: (res) => {
        this.medios.unshift(res);
        this.filteredMedios = [...this.medios];
        this.nuevo = { nombre: '' };
        this.selectedAction = 'listar';
      },
      error: (err) => {
        alert('Error al crear medio de cobro');
      },
    });
  }

  // =============== ELIMINACIÓN ===============
  eliminar(id: number) {
    if (!confirm('¿Eliminar este medio de cobro?')) return;

    this.medioService.deleteMedio(id).subscribe({
      next: () => {
        this.medios = this.medios.filter((m) => m.id !== id);
        this.filteredMedios = [...this.medios];
      },
      error: (err) => {
        alert('No se pudo eliminar');
      },
    });
  }

  // =============== EDICIÓN INLINE ===============
  startEdit(medio: MedioCobro) {
    this.editingId = medio.id;
    this.editBuffer = { nombre: medio.nombre };
  }

  cancelEdit() {
    this.editingId = null;
    this.editBuffer = {};
  }

  saveEdit(id: number) {
    if (!this.editBuffer.nombre?.trim()) {
      alert('Debe ingresar un nombre válido');
      return;
    }

    this.medioService.updateMedio(id, this.editBuffer).subscribe({
      next: () => {
        const idx = this.medios.findIndex(m => m.id === id);
        if (idx >= 0) this.medios[idx].nombre = this.editBuffer.nombre!;
        this.cancelEdit();
      },
      error: (err) => {
        alert('Error al actualizar');
      },
    });
  }
}