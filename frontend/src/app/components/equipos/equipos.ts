// src/app/components/equipos/equipos.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EquipoService, Equipo, PaginatedResponse } from '../../services/equipos';
import { SearchService } from '../../services/busquedaglobal';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-equipos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './equipos.html',
  styleUrls: ['./equipos.css'],
})
export class EquiposComponent implements OnInit, OnDestroy {
  equipos: Equipo[] = [];
  filteredEquipos: Equipo[] = [];
  selectedAction: 'listar' | 'crear' | 'editar' | 'eliminar' = 'listar';
  loading = false;
  
  // Variables de paginación
  currentPage = 1;
  lastPage = 1;
  perPage = 15;
  total = 0;
  from = 0;
  to = 0;
  hasMorePages = true;
  
  nuevoEquipo: Partial<Equipo> = {};
  
  private searchSubscription!: Subscription;

  constructor(
    private equipoService: EquipoService,
    private searchService: SearchService
  ) {}

  ngOnInit() {
    this.obtenerEquipos();
    
    this.searchService.setCurrentComponent('equipos');
    window.addEventListener('scroll', this.onScroll.bind(this));
    this.searchSubscription = this.searchService.searchTerm$.subscribe(term => {
      this.filterEquipos(term);
    });
  }

  ngOnDestroy() {
    window.removeEventListener('scroll', this.onScroll.bind(this));

    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
    this.searchService.clearSearch();
  }

  obtenerEquipos(page: number = 1) {
    if (this.loading || !this.hasMorePages) return;
    
    this.loading = true;

    this.equipoService.getEquipos(page, this.perPage).subscribe({
      next: (response: PaginatedResponse<Equipo>) => {
        if (page === 1) {
          // Primera página - reemplazar
          this.equipos = response.data;
        } else {
          // Páginas siguientes - concatenar
          this.equipos = [...this.equipos, ...response.data];
        }
        
        this.filteredEquipos = [...this.equipos];
        this.currentPage = response.current_page;
        this.lastPage = response.last_page;
        this.total = response.total;
        this.from = response.from;
        this.to = response.to;
        this.hasMorePages = response.current_page < response.last_page;
        
        this.loading = false;
        this.searchService.setSearchData(this.equipos);
      },
      error: (err) => {
        console.error('Error al obtener equipos', err);
        this.loading = false;
      },
    });
  }

  onScroll() {
    if (this.loading || !this.hasMorePages) return;
    
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    
    // Cargar más cuando esté cerca del final (100px antes)
    const nearBottom = scrollTop + clientHeight >= scrollHeight - 100;
    
    if (nearBottom && this.hasMorePages) {
      this.obtenerEquipos(this.currentPage + 1);
    }
  }

  private filterEquipos(searchTerm: string) {
    if (!searchTerm) {
      this.filteredEquipos = [...this.equipos];
      return;
    }

    this.filteredEquipos = this.searchService.search(this.equipos, searchTerm, 'equipos');
  }

  clearSearch() {
    this.searchService.clearSearch();
  }

  seleccionarAccion(accion: 'listar' | 'crear' | 'editar' | 'eliminar') {
    this.selectedAction = accion;
  }

  crearEquipo() {
    if (!this.nuevoEquipo.descripcion) {
      alert('La descripción es obligatoria');
      return;
    }

    this.equipoService.createEquipo(this.nuevoEquipo).subscribe({
      next: (nuevoEquipo) => {
        this.nuevoEquipo = {};
        // Agregar al inicio
        this.equipos = [nuevoEquipo, ...this.equipos];
        this.filteredEquipos = [nuevoEquipo, ...this.filteredEquipos];
        this.selectedAction = 'listar';
        this.searchService.setSearchData(this.equipos);
      },
      error: (err) => {
        console.error('Error al crear equipo', err);
        alert(err.error?.error || 'Error al crear equipo');
      },
    });
  }

  eliminarEquipo(id: number) {
    if (!confirm('¿Seguro que querés eliminar este equipo?')) return;

    this.equipoService.deleteEquipo(id).subscribe({
      next: () => {
        this.equipos = this.equipos.filter((e) => e.id !== id);
        this.filteredEquipos = this.filteredEquipos.filter((e) => e.id !== id);
        this.searchService.setSearchData(this.equipos);
      },
      error: (err) => {
        console.error('Error al eliminar equipo', err);
      },
    });
  }

  // Método para recargar desde el inicio
  recargarEquipos() {
    this.currentPage = 1;
    this.hasMorePages = true;
    this.obtenerEquipos(1);
  }
}