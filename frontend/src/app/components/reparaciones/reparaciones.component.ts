import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReparacionService, Reparacion, PaginatedResponse } from '../../services/reparacion.service';
import { SearchService } from '../../services/busquedaglobal';
import { EquipoService } from '../../services/equipos';
import { ClienteService } from '../../services/cliente.service';
import { UsuarioService } from '../../services/usuario.service';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
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
  selectedAction: Acción = 'listar';

  // listado + paginación
  reparacionesAll: Reparacion[] = [];
  reparacionesFiltradas: Reparacion[] = [];
  page = 1;
  perPage = 10;
  lastPage = false;
  loading = false;

  // Búsqueda global
  private searchSub?: Subscription;
  searchTerm: string = '';
  
  // Búsqueda en servidor
  private isServerSearch = false;
  private serverSearchPage = 1;
  private serverSearchLastPage = false;
  private busquedaReparacion = new Subject<string>();

  // Propiedades para selección (CREACIÓN)
  equipoSeleccionado: SearchResult | null = null;
  clienteSeleccionado: SearchResult | null = null;
  tecnicoSeleccionado: SearchResult | null = null;

  // Propiedades para selección (EDICIÓN)
  equipoEditSeleccionado: SearchResult | null = null;
  clienteEditSeleccionado: SearchResult | null = null;
  tecnicoEditSeleccionado: SearchResult | null = null;

  // Referencias a los componentes de búsqueda (CREACIÓN)
  @ViewChild('clienteSelector') clienteSelector!: SearchSelectorComponent;
  @ViewChild('equipoSelector') equipoSelector!: SearchSelectorComponent;
  @ViewChild('tecnicoSelector') tecnicoSelector!: SearchSelectorComponent;

  // Referencias a los componentes de búsqueda (EDICIÓN)
  @ViewChild('equipoEditSelector') equipoEditSelector!: SearchSelectorComponent;
  @ViewChild('tecnicoEditSelector') tecnicoEditSelector!: SearchSelectorComponent;

  // edición inline
  editingId: number | null = null;
  editBuffer: Partial<Reparacion> = {};

  // creación
  nuevo: Partial<Reparacion> = {
    fecha: new Date().toISOString().slice(0, 10),
    estado: 'pendiente'
  };

  private subs: Subscription[] = [];


  constructor(
    private repService: ReparacionService,
    private searchService: SearchService,
    private clienteService: ClienteService,
    private equipoService: EquipoService,
    private usuarioService: UsuarioService,
  ) {}

  ngOnInit(): void {
    this.resetList();
    this.configurarBusqueda();
    this.configurarBusquedaReparaciones();
    window.addEventListener('scroll', this.onScroll);
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    this.searchSub?.unsubscribe();
    this.busquedaReparacion.unsubscribe();
    this.searchService.clearSearch();
  }

  // ====== CONFIGURACIÓN DE BÚSQUEDA GLOBAL ======
  private configurarBusqueda(): void {
    this.searchService.setCurrentComponent('reparaciones');
    this.searchSub = this.searchService.searchTerm$.subscribe(term => {
      const oldTerm = this.searchTerm;
      this.searchTerm = (term || '').trim();
      
      console.log('🔍 Búsqueda global cambiada:', { oldTerm, newTerm: this.searchTerm });
      
      if (this.searchTerm) {
        this.onBuscarReparaciones(this.searchTerm);
      } else {
        if (oldTerm !== this.searchTerm) {
          console.log('🔄 Recargando lista completa después de borrar búsqueda');
          this.resetList();
        }
      }
    });
  }

  private configurarBusquedaReparaciones(): void {
    this.busquedaReparacion.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(termino => {
      this.buscarEnServidor(termino);
    });
  }

  // ====== BÚSQUEDA DE REPARACIONES ======
  onBuscarReparaciones(termino: string): void {
    const terminoLimpio = (termino || '').trim();
    
    if (!terminoLimpio) {
      this.resetBusqueda();
      return;
    }

    this.searchTerm = terminoLimpio;

    if (terminoLimpio.length <= 2) {
      this.applyFilterLocal();
    } else {
      this.busquedaReparacion.next(terminoLimpio);
    }
  }

private buscarEnServidor(termino: string): void {
  this.isServerSearch = true;
  this.serverSearchPage = 1;
  this.serverSearchLastPage = false;

  // ✅ USAR EL NUEVO ENDPOINT PARA BÚSQUEDA TAMBIÉN
  this.repService.listCompleto(1, this.perPage, termino).subscribe({
    next: (response: PaginatedResponse<Reparacion>) => {
      this.reparacionesAll = response.data;
      this.reparacionesFiltradas = [...this.reparacionesAll];
      
      // Preparar datos para búsqueda global
      const itemsForSearch = this.reparacionesAll.map(reparacion => ({
        ...reparacion,
        // Los campos ya vienen poblados del nuevo endpoint
        tecnico_nombre: this.getTecnicoNombre(reparacion),
        equipo_nombre: this.getEquipoNombre(reparacion),
        reparacion_nombre: reparacion.descripcion || 'Sin descripción',
        cliente_nombre: this.getClienteNombre(reparacion)
      }));
      this.searchService.setSearchData(itemsForSearch);
    },
    error: (error) => {
      console.error('Error en búsqueda servidor:', error);
      this.applyFilterLocal();
    }
  });
}

  private applyFilterLocal(): void {
    const term = this.searchTerm.toLowerCase();
    
    if (!term) {
      this.reparacionesFiltradas = [...this.reparacionesAll];
      this.isServerSearch = false;
      this.serverSearchPage = 1;
      this.serverSearchLastPage = false;
      return;
    }

    if (term.length > 2) {
      this.buscarEnServidor(term);
    } else {
      this.isServerSearch = false;
      
      const filtered = this.reparacionesAll.filter(reparacion => {
        const searchableText = [
          reparacion.descripcion,
          reparacion.estado,
          this.getEquipoNombre(reparacion),
          this.getTecnicoNombre(reparacion),
          this.getClienteNombre(reparacion)
        ].join(' ').toLowerCase();
        
        return searchableText.includes(term);
      });
      
      this.reparacionesFiltradas = filtered;
    }
  }

  private resetBusqueda(): void {
    this.isServerSearch = false;
    this.serverSearchPage = 1;
    this.serverSearchLastPage = false;
    this.reparacionesFiltradas = [...this.reparacionesAll];
  }

  // ====== LISTA / SCROLL ======
cargar() {
  if (this.loading || this.lastPage) return;
  
  this.loading = true;
  
  const searchTerm = this.searchTerm && this.searchTerm.trim() ? this.searchTerm.trim() : '';
  
  this.repService.listCompleto(this.page, this.perPage, searchTerm).subscribe({
    next: (res: PaginatedResponse<Reparacion>) => {
      const nuevasReparaciones = res.data;
      
      console.log('✅ Reparaciones cargadas con nuevo endpoint - DETALLADO:');
      nuevasReparaciones.forEach((rep, index) => {
        console.log(`Reparación ${index + 1}:`, {
          id: rep.id,
          descripcion: rep.descripcion,
          equipo_nombre: rep.equipo_nombre,
          tecnico_nombre: rep.tecnico_nombre,
          cliente_nombre: rep.cliente_nombre,
          equipo: rep.equipo,
          tecnico: rep.tecnico
        });
      });
      
      if (this.page === 1) {
        this.reparacionesAll = nuevasReparaciones;
      } else {
        this.reparacionesAll = [...this.reparacionesAll, ...nuevasReparaciones];
      }

      this.page++;
      this.lastPage = (res.current_page >= res.last_page);
      this.loading = false;
      
      this.applyFilterLocal();
      this.prepararDatosParaBusquedaGlobal();
    },
    error: (e) => {
      this.loading = false;
      console.error('Error cargando reparaciones:', e);
    }
  });
}

private procesarReparacionesParaDisplay(reparaciones: Reparacion[]): Reparacion[] {
  return reparaciones.map(reparacion => {
    // 🔥 CORRECCIÓN: Manejar mejor los casos donde las relaciones pueden ser null/undefined
    const equipoNombre = this.getEquipoNombre(reparacion);
    const tecnicoNombre = this.getTecnicoNombre(reparacion);
    const clienteNombre = this.getClienteNombre(reparacion);
    
    return {
      ...reparacion,
      // 🔥 Asegurar que siempre tengamos valores para display
      equipo_nombre: equipoNombre,
      tecnico_nombre: tecnicoNombre,
      cliente_nombre: clienteNombre,
      // Mantener las relaciones originales si existen
      equipo: reparacion.equipo || undefined,
      tecnico: reparacion.tecnico || undefined
    };
  });
}
  /**
   * 🔥 NUEVO MÉTODO: Preparar datos para búsqueda global
   */
private prepararDatosParaBusquedaGlobal(): void {
  // ✅ Las reparaciones ya vienen procesadas del servicio
  const itemsForSearch = this.reparacionesAll.map(reparacion => ({
    ...reparacion,
    // Estos campos ya están poblados por el servicio
    tecnico_nombre: this.getTecnicoNombre(reparacion),
    equipo_nombre: this.getEquipoNombre(reparacion),
    reparacion_nombre: reparacion.descripcion || 'Sin descripción',
    cliente_nombre: this.getClienteNombre(reparacion)
  }));
  
  this.searchService.setSearchData(itemsForSearch);
}

  private cargarMasResultadosBusqueda(): void {
  if (this.loading || this.serverSearchLastPage) return;
  
  this.loading = true;
  this.serverSearchPage++;

  // ✅ USAR EL NUEVO ENDPOINT PARA CARGAR MÁS RESULTADOS
  this.repService.listCompleto(this.serverSearchPage, this.perPage, this.searchTerm).subscribe({
    next: (response: PaginatedResponse<Reparacion>) => {
      const nuevasReparaciones = response.data;
      
      if (Array.isArray(nuevasReparaciones) && nuevasReparaciones.length > 0) {
        this.reparacionesAll = [...this.reparacionesAll, ...nuevasReparaciones];
        this.reparacionesFiltradas = [...this.reparacionesAll];
        
        const itemsForSearch = this.reparacionesAll.map(reparacion => ({
          ...reparacion,
          tecnico_nombre: this.getTecnicoNombre(reparacion),
          equipo_nombre: this.getEquipoNombre(reparacion),
          reparacion_nombre: reparacion.descripcion || 'Sin descripción',
          cliente_nombre: this.getClienteNombre(reparacion)
        }));
        this.searchService.setSearchData(itemsForSearch);
      } else {
        this.serverSearchLastPage = true;
      }
      
      this.loading = false;
    },
    error: (error) => {
      console.error('Error cargando más resultados:', error);
      this.loading = false;
      this.serverSearchLastPage = true;
    }
  });
}

  onScroll = () => {
    if (this.loading) return;
    
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 120;
    
    if (nearBottom) {
      if (this.isServerSearch && !this.serverSearchLastPage) {
        this.cargarMasResultadosBusqueda();
      } else if (!this.isServerSearch && !this.lastPage) {
        this.cargar();
      }
    }
  };

  private resetList() {
    this.page = 1;
    this.lastPage = false;
    this.serverSearchPage = 1;
    this.serverSearchLastPage = false;
    this.isServerSearch = false;
    this.reparacionesAll = [];
    this.reparacionesFiltradas = [];
    
    if (this.searchTerm) {
      this.applyFilterLocal();
    } else {
      this.cargar();
    }
  }

  // ====== MÉTODOS HELPER PARA OBTENER NOMBRES ======
getClienteNombre(r: Reparacion): string {
  // 1) Si el backend lo envía como campo directo
  if (r.cliente_nombre && r.cliente_nombre !== 'No especificado') {
    return r.cliente_nombre;
  }

  // 2) Si viene dentro del equipo
  if (r.equipo?.cliente?.nombre) {
    return r.equipo.cliente.nombre;
  }

  return 'No especificado';
}

getEquipoNombre(r: Reparacion): string {
  if (r.equipo_nombre && r.equipo_nombre !== 'Sin equipo') {
    return r.equipo_nombre;
  }

  if (r.equipo?.descripcion) {
    return r.equipo.descripcion;
  }

  return 'Sin equipo';
}

getTecnicoNombre(r: Reparacion): string {
  if (r.tecnico_nombre && r.tecnico_nombre !== 'Sin técnico') {
    return r.tecnico_nombre;
  }

  if (r.tecnico?.nombre) {
    return r.tecnico.nombre;
  }

  return 'Sin técnico';
}

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
        // ✅ Agregar directamente, el servicio procesará en la próxima carga
        this.reparacionesAll.unshift(nuevaReparacion);
        this.applyFilterLocal();

        // Limpiar formulario completamente
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

  // ====== ELIMINAR ======
  eliminar(id: number) {
    if (!confirm('¿Eliminar esta reparación?')) return;

    this.repService.delete(id).subscribe({
      next: () => {
        this.reparacionesAll = this.reparacionesAll.filter(r => r.id !== id);
        this.applyFilterLocal();
        this.prepararDatosParaBusquedaGlobal();
      },
      error: (e) => {
        alert('Error al eliminar la reparación');
      }
    });
  }

  // ====== EDICIÓN INLINE ======
  startEdit(item: Reparacion) {
    this.editingId = item.id;
    this.editBuffer = {
      descripcion: item.descripcion,
      equipo_id: item.equipo_id,
      usuario_id: item.usuario_id,
      fecha: item.fecha?.slice(0, 10),
      estado: item.estado,
    };

    // Precargar datos en los selectors de edición
    this.precargarDatosEdicion(item);
  }

  private precargarDatosEdicion(item: Reparacion) {
    // Limpiar selecciones previas
    this.equipoEditSeleccionado = null;
    this.tecnicoEditSeleccionado = null;

    // Precargar cliente (solo para mostrar, no editable)
    if (item.equipo && item.equipo.cliente) {
      this.clienteEditSeleccionado = {
        id: item.equipo.cliente.id,
        nombre: item.equipo.cliente.nombre,
        email: item.equipo.cliente.email,
        telefono: item.equipo.cliente.telefono
      };
    }

    // Precargar equipo
    if (item.equipo) {
      this.equipoEditSeleccionado = {
        id: item.equipo.id,
        descripcion: item.equipo.descripcion,
        marca: item.equipo.marca,
        modelo: item.equipo.modelo,
        nro_serie: item.equipo.nro_serie,
        cliente_id: item.equipo.cliente_id
      };

      // Cargar equipos del cliente para el selector
      this.cargarTodosLosEquiposDelClienteEdit();
    } else {
      // Si no tenemos los datos del equipo, cargarlos desde la API
      if (item.equipo_id) {
        this.equipoService.getEquipo(item.equipo_id).subscribe({
          next: (equipo) => {
            this.equipoEditSeleccionado = {
              id: equipo.id,
              descripcion: equipo.descripcion,
              marca: equipo.marca,
              modelo: equipo.modelo,
              nro_serie: equipo.nro_serie
            };
            
            // Precargar cliente del equipo
            if (equipo.cliente_id) {
              this.clienteService.getCliente(equipo.cliente_id).subscribe({
                next: (cliente) => {
                  this.clienteEditSeleccionado = {
                    id: cliente.id,
                    nombre: cliente.nombre,
                    email: cliente.email,
                    telefono: cliente.telefono
                  };
                  // Cargar equipos del cliente para el selector
                  this.cargarTodosLosEquiposDelClienteEdit();
                },
                error: (e) => {
                  console.error('Error al cargar cliente:', e);
                }
              });
            }
          },
          error: (e) => {
            console.error('Error al cargar equipo:', e);
          }
        });
      }
    }

    // Precargar técnico
    if (item.usuario_id) {
      this.usuarioService.getTecnicos(1, 50).subscribe({
        next: (response: any) => {
          // Acceder a response.data en lugar de response directamente
          const tecnicos = response.data || response;
          const tecnico = Array.isArray(tecnicos) ? 
            tecnicos.find((t: any) => t.id === item.usuario_id) : 
            null;
          
          if (tecnico) {
            this.tecnicoEditSeleccionado = tecnico;
          }
        },
        error: (e) => {
          console.error('Error al cargar técnicos para edición:', e);
        }
      });
    }
  }

  cancelEdit() {
    this.editingId = null;
    this.editBuffer = {};
    this.clienteEditSeleccionado = null;
    this.equipoEditSeleccionado = null;
    this.tecnicoEditSeleccionado = null;
  }

  saveEdit(id: number) {
  if (!this.editBuffer.equipo_id || !this.editBuffer.usuario_id || !this.editBuffer.descripcion || !this.editBuffer.fecha || !this.editBuffer.estado) {
    alert('Completá todos los campos: equipo, técnico, descripción, fecha y estado.');
    return;
  }

  this.repService.update(id, this.editBuffer).subscribe({
    next: (res: any) => {
      const idx = this.reparacionesAll.findIndex(r => r.id === id);
      if (idx >= 0) {
        // ✅ Actualizar directamente, las relaciones se cargarán en la próxima recarga
        const reparacionActualizada = {
          ...this.reparacionesAll[idx],
          ...this.editBuffer
        } as Reparacion;
        
        this.reparacionesAll[idx] = reparacionActualizada;
        this.applyFilterLocal();
        this.prepararDatosParaBusquedaGlobal();
      }
      this.cancelEdit();
      alert('Reparación actualizada exitosamente!');
    },
    error: (e) => {
      alert(e?.error?.error ?? 'Error al actualizar la reparación');
    }
  });
}

  // ====== LIMPIAR BÚSQUEDA GLOBAL ======
  limpiarBusqueda() {
    this.searchService.clearSearch();
    this.searchTerm = '';
    this.resetList();
  }

  // ====== MÉTODOS PARA CARGAR DATOS INICIALES ======
  cargarClientesIniciales() {
    this.clienteService.getClientes(1, 10).subscribe({
      next: (res: any) => {
        // Acceder a res.data
        const clientes = res.data ?? res;
        const clientesMostrar = Array.isArray(clientes) ? clientes.slice(0, 5) : [];
        this.clienteSelector.updateSuggestions(clientesMostrar);
      },
      error: (e) => {
        this.clienteSelector.updateSuggestions([]);
      }
    });
  }

  cargarTecnicosIniciales() {
    this.usuarioService.getTecnicos(1, 10).subscribe({
      next: (res: any) => {
        // Acceder a res.data
        const tecnicos = res.data ?? res;
        const tecnicosMostrar = Array.isArray(tecnicos) ? tecnicos.slice(0, 5) : [];
        this.tecnicoSelector.updateSuggestions(tecnicosMostrar);
      },
      error: (e) => {
        this.tecnicoSelector.updateSuggestions([]);
      }
    });
  }

  cargarTecnicosInicialesEdit() {
    this.usuarioService.getTecnicos(1, 10).subscribe({
      next: (res: any) => {
        // Acceder a res.data
        const tecnicos = res.data ?? res;
        const tecnicosMostrar = Array.isArray(tecnicos) ? tecnicos.slice(0, 5) : [];
        this.tecnicoEditSelector?.updateSuggestions(tecnicosMostrar);
      },
      error: (e) => {
        this.tecnicoEditSelector?.updateSuggestions([]);
      }
    });
  }

  cargarEquiposIniciales() {
    if (this.clienteSeleccionado) {
      this.cargarTodosLosEquiposDelCliente();
    }
  }

  cargarEquiposInicialesEdit() {
    if (this.clienteEditSeleccionado) {
      this.cargarTodosLosEquiposDelClienteEdit();
    }
  }

  // ====== MÉTODOS DE FOCUS ACTUALIZADOS ======
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

  // ====== HELPERS PARA EL TEMPLATE ======
  isListar(): boolean {
    return this.selectedAction === 'listar';
  }

  isCrear(): boolean {
    return this.selectedAction === 'crear';
  }

  seleccionarAccion(a: Acción) {
    this.selectedAction = a;
  }

  // ====== MÉTODOS AUXILIARES PARA EL TEMPLATE ======
getEstadoBadgeClass(estado: string): string {
  if (!estado) return 'badge bg-secondary';

  const cleaned = estado.replace('_', ' ').trim().toLowerCase();

  switch (cleaned) {
    case 'pendiente':
      return 'badge bg-warning text-white';  // amarillo
    case 'en proceso':
      return 'badge bg-info text-white';     // celeste
    case 'finalizada':
    case 'completado':
      return 'badge bg-success';            // verde
    case 'cancelada':
      return 'badge bg-danger';             // rojo
    default:
      return 'badge bg-secondary';          // gris
  }
}


getEstadoDisplayText(estado: string): string {
  if (!estado) return 'Desconocido';

  // Normalizar
  const cleaned = estado.replace('_', ' ').trim().toLowerCase();

  // Formatear: primera letra mayúscula + resto igual
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

  // ====== BÚSQUEDA DE CLIENTES (CREACIÓN) ======
  buscarClientes(termino: string) {
    if (termino.length < 2) {
      this.clienteSelector.updateSuggestions([]);
      return;
    }

    this.clienteService.buscarClientesParaSelector(termino).subscribe({
      next: (clientes: SearchResult[]) => {
        this.clienteSelector.updateSuggestions(clientes);
      },
      error: (e) => {
        this.clienteSelector.updateSuggestions([]);
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

  // ====== BÚSQUEDA DE EQUIPOS (CREACIÓN) ======
  buscarEquipos(termino: string = '') {
    if (!this.clienteSeleccionado) {
      this.equipoSelector.updateSuggestions([]);
      return;
    }

    this.equipoService.buscarEquiposConFiltro(termino, this.clienteSeleccionado.id).subscribe({
      next: (equipos: SearchResult[]) => {
        this.equipoSelector.updateSuggestions(equipos);
      },
      error: (e) => {
        console.error('Error buscando equipos:', e);
        this.equipoSelector.updateSuggestions([]);
      }
    });
  }

  cargarTodosLosEquiposDelCliente() {
    if (!this.clienteSeleccionado?.id) return;

    this.equipoService.buscarEquiposPorCliente(this.clienteSeleccionado.id).subscribe({
      next: (equipos: SearchResult[]) => {
        this.equipoSelector.updateSuggestions(equipos);
      },
      error: (e) => {
        console.error('Error cargando equipos del cliente:', e);
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

  // ====== BÚSQUEDA DE EQUIPOS (EDICIÓN) ======
  buscarEquiposEdit(termino: string = '') {
    if (!this.clienteEditSeleccionado) {
      this.equipoEditSelector?.updateSuggestions([]);
      
      // Mostrar mensaje de que no hay cliente seleccionado
      if (this.equipoEditSelector) {
        this.setEquipoEditSelectorMessage('noClient', true);
      }
      return;
    }

    // Limpiar mensajes
    if (this.equipoEditSelector) {
      this.setEquipoEditSelectorMessage('noClient', false);
    }

    this.equipoService.buscarEquiposConFiltro(termino, this.clienteEditSeleccionado.id).subscribe({
      next: (equipos: SearchResult[]) => {
        this.equipoEditSelector?.updateSuggestions(equipos);
        
        // Mostrar mensaje si no hay resultados
        if (this.equipoEditSelector && equipos.length === 0 && termino.length >= 2) {
          this.setEquipoEditSelectorMessage('noResults', true);
        } else if (this.equipoEditSelector) {
          this.setEquipoEditSelectorMessage('noResults', false);
          this.setEquipoEditSelectorMessage('noEquipos', false);
        }
      },
      error: (e) => {
        console.error('Error buscando equipos en edición:', e);
        this.equipoEditSelector?.updateSuggestions([]);
      }
    });
  }

  cargarTodosLosEquiposDelClienteEdit() {
    if (!this.clienteEditSeleccionado?.id) {
      this.equipoEditSelector?.updateSuggestions([]);
      return;
    }

    this.equipoService.buscarEquiposPorCliente(this.clienteEditSeleccionado.id).subscribe({
      next: (equipos: SearchResult[]) => {
        this.equipoEditSelector?.updateSuggestions(equipos);
        
        // Mostrar mensaje si el cliente no tiene equipos
        if (this.equipoEditSelector && equipos.length === 0) {
          this.setEquipoEditSelectorMessage('noEquipos', true);
        } else if (this.equipoEditSelector) {
          this.setEquipoEditSelectorMessage('noEquipos', false);
        }
      },
      error: (e) => {
        console.error('Error cargando equipos del cliente en edición:', e);
        this.equipoEditSelector?.updateSuggestions([]);
      }
    });
  }

  seleccionarEquipoEdit(equipo: SearchResult) {
    this.equipoEditSeleccionado = equipo;
    this.editBuffer.equipo_id = equipo.id;
  }

  limpiarEquipoEdit() {
    this.equipoEditSeleccionado = null;
    this.editBuffer.equipo_id = undefined;
  }

  // ====== BÚSQUEDA DE TÉCNICOS (CREACIÓN) ======
  buscarTecnicos(termino: string) {
    if (termino.length < 2) {
      this.tecnicoSelector.updateSuggestions([]);
      return;
    }

    this.usuarioService.buscarTecnicos(termino).subscribe({
      next: (tecnicos: SearchResult[]) => {
        this.tecnicoSelector.updateSuggestions(tecnicos);
      },
      error: (e) => {
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

  // ====== BÚSQUEDA DE TÉCNICOS (EDICIÓN) ======
  buscarTecnicosEdit(termino: string) {
    if (termino.length < 2) {
      this.tecnicoEditSelector?.updateSuggestions([]);
      return;
    }

    this.usuarioService.buscarTecnicos(termino).subscribe({
      next: (tecnicos: SearchResult[]) => {
        this.tecnicoEditSelector?.updateSuggestions(tecnicos);
      },
      error: (e) => {
        this.tecnicoEditSelector?.updateSuggestions([]);
      }
    });
  }

  seleccionarTecnicoEdit(tecnico: SearchResult) {
    this.tecnicoEditSeleccionado = tecnico;
    this.editBuffer.usuario_id = tecnico.id;
  }

  limpiarTecnicoEdit() {
    this.tecnicoEditSeleccionado = null;
    this.editBuffer.usuario_id = undefined;
  }

  // ====== NUEVOS MÉTODOS PARA MANEJO DE MENSAJES ======

  // Método para validar el formulario
  isFormValid(): boolean {
    return !!(this.clienteSeleccionado && 
             this.equipoSeleccionado && 
             this.tecnicoSeleccionado && 
             this.nuevo.descripcion && 
             this.nuevo.fecha && 
             this.nuevo.estado);
  }

  // Método seguro para establecer mensajes en el selector de equipos en edición
  private setEquipoEditSelectorMessage(type: 'noClient' | 'noResults' | 'noEquipos', show: boolean): void {
    if (!this.equipoEditSelector) return;

    // Usar una propiedad extendida para almacenar estados de mensajes
    const selector = this.equipoEditSelector as any;
    
    switch (type) {
      case 'noClient':
        selector._showNoClientMessage = show;
        break;
      case 'noResults':
        selector._showNoResultsMessage = show;
        break;
      case 'noEquipos':
        selector._showNoEquiposMessage = show;
        break;
    }
  }

  // Método para verificar si hay mensajes activos en el selector de equipos en edición
  hasEquipoEditSelectorMessage(): boolean {
    if (!this.equipoEditSelector) return false;
    
    const selector = this.equipoEditSelector as any;
    return selector._showNoClientMessage || selector._showNoResultsMessage || selector._showNoEquiposMessage;
  }

  // Método para obtener el mensaje activo del selector de equipos en edición
  getEquipoEditSelectorMessage(): string {
    if (!this.equipoEditSelector) return '';

    const selector = this.equipoEditSelector as any;
    
    if (selector._showNoClientMessage) {
      return 'Primero selecciona un cliente';
    }
    if (selector._showNoResultsMessage) {
      return 'No se encontraron equipos con ese criterio';
    }
    if (selector._showNoEquiposMessage) {
      return 'Este cliente no tiene equipos registrados';
    }
    
    return '';
  }
}