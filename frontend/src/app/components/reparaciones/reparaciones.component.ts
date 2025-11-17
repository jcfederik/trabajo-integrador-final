import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ReparacionService,
  Reparacion,
  Paginated,
} from '../../services/reparacion.service';
import { SearchService } from '../../services/busquedaglobal';
import { EquipoService } from '../../services/equipos';
import { ClienteService } from '../../services/cliente.service';
import { UsuarioService } from '../../services/usuario.service';

type Acción = 'listar'|'crear';

@Component({
  selector: 'app-reparaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reparaciones.component.html',
  styleUrls: ['./reparaciones.component.css']
})
export class ReparacionesComponent implements OnInit, OnDestroy {
  selectedAction: Acción = 'listar';

  // listado + paginación
  reparaciones: Reparacion[] = [];
  reparacionesFiltradas: Reparacion[] = [];
  page = 1;
  perPage = 10;
  lastPage = false;
  loading = false;

  //Término de búsqueda global
  searchTerm: string = '';

  //propiedades para busquedea de equipos y clientes
  equiposSugeridos: any[] = [];
  clientesSugeridos: any[] = [];
  mostrarSugerenciasEquipos = false;
  mostrarSugerenciasClientes = false;
  equipoSeleccionado: any = null;
  clienteSeleccionado: any = null;
  busquedaEquipo = '';
  busquedaCliente = '';

  //Propiedades para búsqueda de técnicos
  tecnicosSugeridos: any[] = [];
  mostrarSugerenciasTecnicos = false;
  tecnicoSeleccionado: any = null;
  busquedaTecnico = '';

  // edición inline
  editingId: number | null = null;
  editBuffer: Partial<Reparacion> = {};

  // creación
  nuevo: Partial<Reparacion> = {
    fecha: new Date().toISOString().slice(0,10),
    estado: 'pendiente'
  };

  constructor(
    private repService: ReparacionService,
    private searchService: SearchService,
    private equipoService: EquipoService,
    private clienteService: ClienteService,
    private usuarioService: UsuarioService 
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.searchService.setCurrentComponent('reparaciones');
    window.addEventListener('scroll', this.onScroll);
    this.configurarBusqueda();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
  }

  seleccionarAccion(a: Acción) {
    this.selectedAction = a;
  }

  configurarBusqueda() {
    this.searchService.searchTerm$.subscribe(term => {
      this.searchTerm = term;
      this.aplicarFiltroBusqueda();
    });
  }

  aplicarFiltroBusqueda() {
    if (!this.searchTerm) {
      this.reparacionesFiltradas = [...this.reparaciones];
    } else {
      const resultados = this.searchService.search(
        this.reparaciones,
        this.searchTerm,
        'reparaciones'
      );
      this.reparacionesFiltradas = resultados;
    }
  }

  //Buscar clientes
  buscarClientes(termino: string) {
    if (termino.length < 2) {
      this.clientesSugeridos = [];
      this.mostrarSugerenciasClientes = false;
      return;
    }

    this.loading = true;

    this.repService.buscarClientes(termino).subscribe({
      next: (clientes: any) => {
        this.clientesSugeridos = clientes;
        this.mostrarSugerenciasClientes = true;
        this.loading = false;
      },
      error: (e) => {
        this.clientesSugeridos = [];
        this.mostrarSugerenciasClientes = false;
        this.loading = false;
      }
    });
  }

  //Buscar equipos
  buscarEquipos(termino: string = '') {
    if (!this.clienteSeleccionado) {
      this.equiposSugeridos = [];
      this.mostrarSugerenciasEquipos = false;
      return;
    }

    if (!termino) {
      this.cargarTodosLosEquiposDelCliente();
      return;
    }
    this.repService.buscarEquipos(termino).subscribe({
      next: (todosLosEquipos: any) => {
        const equiposDelCliente = todosLosEquipos.filter((equipo: any) => 
          equipo.cliente_id === this.clienteSeleccionado?.id
        );
        
        this.equiposSugeridos = equiposDelCliente;
        this.mostrarSugerenciasEquipos = true;
      },
      error: (e) => {
        this.equiposSugeridos = [];
      }
    });
  }

  //Cargar todos los equipos del cliente seleccionado
  cargarTodosLosEquiposDelCliente() {
    if (!this.clienteSeleccionado?.id) return;

    this.repService.buscarEquiposPorCliente(this.clienteSeleccionado.id).subscribe({
      next: (equipos: any) => {
        this.equiposSugeridos = equipos;
        this.mostrarSugerenciasEquipos = true;
      },
      error: (e) => {
        this.equiposSugeridos = [];
      }
    });
  }

  onFocusEquipos() {
    if (this.clienteSeleccionado && this.equiposSugeridos.length === 0) {
      this.cargarTodosLosEquiposDelCliente();
    }
  }

  seleccionarCliente(cliente: any) {
    this.clienteSeleccionado = cliente;
    this.busquedaCliente = cliente.nombre;
    this.mostrarSugerenciasClientes = false;
    
    this.limpiarEquipo();
    
    this.cargarTodosLosEquiposDelCliente();
  }

  // Seleccionar equipo
  seleccionarEquipo(equipo: any) {
    this.equipoSeleccionado = equipo;
    this.nuevo.equipo_id = equipo.id;
    this.busquedaEquipo = equipo.descripcion + (equipo.modelo ? ` (${equipo.modelo})` : '');
    this.mostrarSugerenciasEquipos = false;
  }

  buscarTecnicos(termino: string) {
    if (termino.length < 2) {
      this.tecnicosSugeridos = [];
      this.mostrarSugerenciasTecnicos = false;
      return;
    }

    this.repService.buscarTecnicos(termino).subscribe({
      next: (tecnicos: any) => {
        this.tecnicosSugeridos = tecnicos;
        this.mostrarSugerenciasTecnicos = true;
      },
      error: (e) => {
        this.tecnicosSugeridos = [];
      }
    });
  }

  //Seleccionar técnico
  seleccionarTecnico(tecnico: any) {
    this.tecnicoSeleccionado = tecnico;
    this.nuevo.usuario_id = tecnico.id;
    this.busquedaTecnico = tecnico.nombre;
    this.mostrarSugerenciasTecnicos = false;
  }

  //Limpiar selección de técnico
  limpiarTecnico() {
    this.tecnicoSeleccionado = null;
    this.nuevo.usuario_id = undefined;
    this.busquedaTecnico = '';
    this.tecnicosSugeridos = [];
    this.mostrarSugerenciasTecnicos = false;
  }

  // Limpiar selección de equipo
  limpiarEquipo() {
    this.equipoSeleccionado = null;
    this.nuevo.equipo_id = undefined;
    this.busquedaEquipo = '';
    this.equiposSugeridos = [];
    this.mostrarSugerenciasEquipos = false;
  }

  // Limpiar selección de cliente
  limpiarCliente() {
    this.clienteSeleccionado = null;
    this.busquedaCliente = '';
    this.clientesSugeridos = [];
    this.mostrarSugerenciasClientes = false;
    this.limpiarEquipo(); // Limpiar también el equipo
  }

  formatearReparacionesParaBusqueda(reparaciones: Reparacion[]): Reparacion[] {
    return reparaciones.map(reparacion => {
      const tecnicoNombre = reparacion.tecnico?.nombre || 
                          reparacion.tecnico?.name || 
                          'Sin técnico';
      
      const equipoNombre = reparacion.equipo?.descripcion || 
                          reparacion.equipo?.modelo || 
                          'Sin equipo';
      
      const reparacionFormateada = {
        ...reparacion,
        tecnico_nombre: tecnicoNombre,
        equipo_nombre: equipoNombre,
        reparacion_nombre: reparacion.descripcion || 'Sin descripción'
      };
      
      return reparacionFormateada;
    });
  }

  // ====== LISTA / SCROLL ======
  cargar() {
    if (this.loading || this.lastPage) return;
    this.loading = true;

    this.repService.list(this.page, this.perPage).subscribe({
      next: (res: Paginated<Reparacion>) => {
        const nuevasReparaciones = res.data;
        
        const reparacionesFormateadas = this.formatearReparacionesParaBusqueda(nuevasReparaciones);
        
        this.reparaciones = [...this.reparaciones, ...reparacionesFormateadas];
        this.page++;
        this.lastPage = (res.next_page_url === null);
        this.loading = false;
        
        this.aplicarFiltroBusqueda();
      },
      error: (e) => {
        this.loading = false;
      }
    });
  }

  onScroll = () => {
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 120;
    if (nearBottom) this.cargar();
  };

  // ====== CREAR ======
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
          
          // Limpiar formulario completamente
          this.nuevo = { 
            fecha: new Date().toISOString().slice(0,10), 
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

  // ====== ELIMINAR ======
  eliminar(id: number) {
    if (!confirm('¿Eliminar esta reparación?')) return;
    this.repService.delete(id).subscribe({
      next: () => {
        this.reparaciones = this.reparaciones.filter(r => r.id !== id);
        this.aplicarFiltroBusqueda();
      },
      error: (e) => {
      }
    });
  }

  // ====== EDICIÓN INLINE ======
  startEdit(item: Reparacion) {
    this.editingId = item.id;
    this.editBuffer = {
      equipo_id: item.equipo_id,
      usuario_id: item.usuario_id,
      descripcion: item.descripcion,
      fecha: item.fecha?.slice(0,10),
      estado: item.estado,
    };
  }

  cancelEdit() {
    this.editingId = null;
    this.editBuffer = {};
  }

  saveEdit(id: number) {
    this.repService.update(id, this.editBuffer).subscribe({
      next: (res: any) => {
        const idx = this.reparaciones.findIndex(r => r.id === id);
        if (idx >= 0) {
          const reparacionActualizada = { ...this.reparaciones[idx], ...this.editBuffer } as Reparacion;
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

  // Limpiar búsqueda
  limpiarBusqueda() {
    this.searchService.clearSearch();
  }
  
}