import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReparacionService, Reparacion, Paginated } from '../../services/reparacion.service';
import { SearchService } from '../../services/busquedaglobal';
import { Subscription } from 'rxjs';
import { SearchSelectorComponent, SearchResult } from '../../components/search-selector/search-selector.component';

type Acción = 'listar' | 'crear';

@Component({
  selector: 'app-reparaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchSelectorComponent],
  templateUrl: './reparaciones.component.html',
  styleUrls: ['./reparaciones.component.css']
})
export class ReparacionesComponent implements OnInit, OnDestroy {

  // =============== ESTADO GENERAL ===============
  selectedAction: Acción = 'listar';
  reparaciones: Reparacion[] = [];
  reparacionesFiltradas: Reparacion[] = [];
  page = 1;
  perPage = 10;
  lastPage = false;
  loading = false;
  searchTerm: string = '';

  equipoSeleccionado: SearchResult | null = null;
  clienteSeleccionado: SearchResult | null = null;
  tecnicoSeleccionado: SearchResult | null = null;

  @ViewChild('clienteSelector') clienteSelector!: SearchSelectorComponent;
  @ViewChild('equipoSelector') equipoSelector!: SearchSelectorComponent;
  @ViewChild('tecnicoSelector') tecnicoSelector!: SearchSelectorComponent;

  editingId: number | null = null;
  editBuffer: Partial<Reparacion> = {};

  nuevo: Partial<Reparacion> = {
    fecha: new Date().toISOString().slice(0, 10),
    estado: 'pendiente'
  };

  private subs: Subscription[] = [];

  constructor(
    private repService: ReparacionService,
    private searchService: SearchService
  ) {}

  // =============== CICLO DE VIDA ===============

  ngOnInit(): void {
    this.resetList();
    this.cargar();

    this.searchService.setCurrentComponent('reparaciones');
    window.addEventListener('scroll', this.onScroll);

    const s1 = this.searchService.searchTerm$.subscribe(term => {
      this.searchTerm = term?.trim() || '';
      this.page = 1;
      this.lastPage = false;
      this.reparaciones = [];
      this.cargar();
    });

    const s2 = this.searchService.searchTerm$.subscribe(() => {
      this.page = 1;
      this.lastPage = false;
      this.reparaciones = [];
      this.cargar();
    });

    this.subs.push(s1, s2);
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    this.subs.forEach(s => s.unsubscribe());
  }

  // =============== ACCIONES GENERALES ===============

  seleccionarAccion(a: Acción) {
    this.selectedAction = a;
  }

  aplicarFiltroBusqueda() {
    this.reparacionesFiltradas = [...this.reparaciones];
  }

  // =============== BÚSQUEDA CLIENTES ===============

  buscarClientes(termino: string) {
    if (termino.length < 2) {
      this.clienteSelector.updateSuggestions([]);
      return;
    }

    this.loading = true;
    this.repService.buscarClientes(termino).subscribe({
      next: (clientes: SearchResult[]) => {
        this.clienteSelector.updateSuggestions(clientes);
        this.loading = false;
      },
      error: () => {
        this.clienteSelector.updateSuggestions([]);
        this.loading = false;
      }
    });
  }

  seleccionarCliente(cliente: SearchResult) {
    this.clienteSeleccionado = cliente;
    this.limpiarEquipo();
    this.cargarTodosLosEquiposDelCliente();
  }

  limpiarCliente() {
    this.clienteSeleccionado = null;
    this.limpiarEquipo();
  }

  // =============== BÚSQUEDA EQUIPOS ===============

  buscarEquipos(termino: string = '') {
    if (!this.clienteSeleccionado) {
      this.equipoSelector.updateSuggestions([]);
      return;
    }

    if (!termino) {
      this.cargarTodosLosEquiposDelCliente();
      return;
    }

    this.repService.buscarEquipos(termino).subscribe({
      next: (todosLosEquipos: SearchResult[]) => {
        const equiposDelCliente = todosLosEquipos.filter(
          equipo => equipo.cliente_id === this.clienteSeleccionado?.id
        );
        this.equipoSelector.updateSuggestions(equiposDelCliente);
      },
      error: () => {
        this.equipoSelector.updateSuggestions([]);
      }
    });
  }

  cargarTodosLosEquiposDelCliente() {
    if (!this.clienteSeleccionado?.id) return;

    this.repService.buscarEquiposPorCliente(this.clienteSeleccionado.id).subscribe({
      next: (equipos: SearchResult[]) => {
        this.equipoSelector.updateSuggestions(equipos);
      },
      error: () => {
        this.equipoSelector.updateSuggestions([]);
      }
    });
  }

  seleccionarEquipo(equipo: SearchResult) {
    this.equipoSeleccionado = equipo;
    this.nuevo.equipo_id = equipo.id;
  }

  limpiarEquipo() {
    this.equipoSeleccionado = null;
    this.nuevo.equipo_id = undefined;
    this.equipoSelector.updateSuggestions([]);
  }

  // =============== BÚSQUEDA TÉCNICOS ===============

  buscarTecnicos(termino: string) {
    if (termino.length < 2) {
      this.tecnicoSelector.updateSuggestions([]);
      return;
    }

    this.repService.buscarTecnicos(termino).subscribe({
      next: (tecnicos: SearchResult[]) => {
        this.tecnicoSelector.updateSuggestions(tecnicos);
      },
      error: () => {
        this.tecnicoSelector.updateSuggestions([]);
      }
    });
  }

  seleccionarTecnico(tecnico: SearchResult) {
    this.tecnicoSeleccionado = tecnico;
    this.nuevo.usuario_id = tecnico.id;
  }

  limpiarTecnico() {
    this.tecnicoSeleccionado = null;
    this.nuevo.usuario_id = undefined;
  }

  // =============== FORMATEO ===============

  formatearReparacionesParaBusqueda(reparaciones: Reparacion[]): Reparacion[] {
    return reparaciones.map(reparacion => {
      const tecnicoNombre = reparacion.tecnico?.nombre || reparacion.tecnico?.name || 'Sin técnico';
      const equipoNombre = reparacion.equipo?.descripcion || reparacion.equipo?.modelo || 'Sin equipo';

      return {
        ...reparacion,
        tecnico_nombre: tecnicoNombre,
        equipo_nombre: equipoNombre,
        reparacion_nombre: reparacion.descripcion || 'Sin descripción'
      };
    });
  }

  // =============== SCROLL Y LISTADO ===============

  cargar() {
    if (this.loading || this.lastPage) return;

    this.loading = true;
    this.repService.list(this.page, this.perPage).subscribe({
      next: (res: Paginated<Reparacion>) => {
        const nuevasReparaciones = this.formatearReparacionesParaBusqueda(res.data);

        this.reparaciones = this.page === 1
          ? nuevasReparaciones
          : [...this.reparaciones, ...nuevasReparaciones];

        this.page++;
        this.lastPage = (res.next_page_url === null);
        this.loading = false;
        this.aplicarFiltroBusqueda();
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private resetList() {
    this.page = 1;
    this.lastPage = false;
    this.reparaciones = [];
    this.reparacionesFiltradas = [];
  }

  onScroll = () => {
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 120;
    if (nearBottom) this.cargar();
  };

  // =============== CREAR ===============

  crear() {
    if (!this.nuevo.equipo_id || !this.nuevo.usuario_id || !this.nuevo.descripcion || !this.nuevo.fecha || !this.nuevo.estado) {
      alert('Completá todos los campos: equipo, técnico, descripción, fecha y estado.');
      return;
    }

    this.repService.create(this.nuevo).subscribe({
      next: (response: any) => {
        const nuevaReparacion = response.reparacion || response;

        if (nuevaReparacion) {
          const reparacionFormateada = this.formatearReparacionesParaBusqueda([nuevaReparacion])[0];
          this.reparaciones.unshift(reparacionFormateada);
          this.aplicarFiltroBusqueda();

          this.nuevo = {
            fecha: new Date().toISOString().slice(0, 10),
            estado: 'pendiente'
          };

          this.limpiarCliente();
          this.limpiarEquipo();
          this.limpiarTecnico();
          this.selectedAction = 'listar';

          alert('Reparación creada exitosamente!');
        } else {
          alert('Error: No se recibió la reparación creada');
        }
      },
      error: (e) => {
        alert(e?.error?.error ?? 'Error al crear la reparación');
      }
    });
  }

  // =============== ELIMINAR ===============

  eliminar(id: number) {
    if (!confirm('¿Eliminar esta reparación?')) return;

    this.repService.delete(id).subscribe({
      next: () => {
        this.reparaciones = this.reparaciones.filter(r => r.id !== id);
        this.aplicarFiltroBusqueda();
      },
      error: () => {
        alert('Error al eliminar la reparación');
      }
    });
  }

  // =============== EDICIÓN INLINE ===============

  startEdit(item: Reparacion) {
    this.editingId = item.id;
    this.editBuffer = {
      equipo_id: item.equipo_id,
      usuario_id: item.usuario_id,
      descripcion: item.descripcion,
      fecha: item.fecha?.slice(0, 10),
      estado: item.estado,
    };
  }

  cancelEdit() {
    this.editingId = null;
    this.editBuffer = {};
  }

  saveEdit(id: number) {
    this.repService.update(id, this.editBuffer).subscribe({
      next: () => {
        const idx = this.reparaciones.findIndex(r => r.id === id);
        if (idx >= 0) {
          const reparacionActualizada = {
            ...this.reparaciones[idx],
            ...this.editBuffer
          } as Reparacion;

          this.reparaciones[idx] = this.formatearReparacionesParaBusqueda([reparacionActualizada])[0];
        }
        this.cancelEdit();
        this.aplicarFiltroBusqueda();
      },
      error: (e) => {
        alert(e?.error?.error ?? 'Error al actualizar la reparación');
      }
    });
  }

  // =============== UTILIDADES ===============

  limpiarBusqueda() {
    this.searchService.clearSearch();
  }

  cargarClientesIniciales() {
    this.repService.buscarClientes('').subscribe({
      next: (clientes: SearchResult[]) => {
        const clientesMostrar = clientes.length > 10 ? clientes.slice(0, 5) : clientes;
        this.clienteSelector.updateSuggestions(clientesMostrar);
      },
      error: () => {
        this.clienteSelector.updateSuggestions([]);
      }
    });
  }

  cargarTecnicosIniciales() {
    this.repService.buscarTecnicos('').subscribe({
      next: (tecnicos: SearchResult[]) => {
        const tecnicosMostrar = tecnicos.length > 10 ? tecnicos.slice(0, 5) : tecnicos;
        this.tecnicoSelector.updateSuggestions(tecnicosMostrar);
      },
      error: () => {
        this.tecnicoSelector.updateSuggestions([]);
      }
    });
  }

  cargarEquiposIniciales() {
    if (this.clienteSeleccionado) {
      this.cargarTodosLosEquiposDelCliente();
    }
  }

  onFocusClientes() {
    this.cargarClientesIniciales();
  }

  onFocusTecnicos() {
    this.cargarTecnicosIniciales();
  }

  onFocusEquipos() {
    if (this.clienteSeleccionado) {
      this.cargarEquiposIniciales();
    }
  }
}
