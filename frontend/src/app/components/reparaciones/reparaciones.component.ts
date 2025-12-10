import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReparacionService, Reparacion, PaginatedResponse } from '../../services/reparacion.service';
import { SearchService } from '../../services/busquedaglobal';
import { EquipoService } from '../../services/equipos';
import { ClienteService } from '../../services/cliente.service';
import { UsuarioService } from '../../services/usuario.service';
import { RepuestoService } from '../../services/repuestos.service';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SearchSelectorComponent, SearchResult } from '../../components/search-selector/search-selector.component';
import { AlertService } from '../../services/alert.service';

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

  // ====== PROPIEDADES DE LISTADO Y PAGINACIÓN ======
  reparacionesAll: Reparacion[] = [];
  reparacionesFiltradas: Reparacion[] = [];
  page = 1;
  perPage = 10;
  lastPage = false;
  loading = false;

  // ====== PROPIEDADES DE BÚSQUEDA ======
  private searchSub?: Subscription;
  searchTerm: string = '';
  private isServerSearch = false;
  private serverSearchPage = 1;
  private serverSearchLastPage = false;
  private busquedaReparacion = new Subject<string>();

  // ====== PROPIEDADES PARA SELECCIÓN (CREACIÓN) ======
  equipoSeleccionado: SearchResult | null = null;
  clienteSeleccionado: SearchResult | null = null;
  tecnicoSeleccionado: SearchResult | null = null;

  // ====== PROPIEDADES PARA SELECCIÓN (EDICIÓN) ======
  equipoEditSeleccionado: SearchResult | null = null;
  clienteEditSeleccionado: SearchResult | null = null;
  tecnicoEditSeleccionado: SearchResult | null = null;

  // ====== REFERENCIAS A COMPONENTES DE BÚSQUEDA ======
  @ViewChild('clienteSelector') clienteSelector!: SearchSelectorComponent;
  @ViewChild('equipoSelector') equipoSelector!: SearchSelectorComponent;
  @ViewChild('tecnicoSelector') tecnicoSelector!: SearchSelectorComponent;
  @ViewChild('equipoEditSelector') equipoEditSelector!: SearchSelectorComponent;
  @ViewChild('tecnicoEditSelector') tecnicoEditSelector!: SearchSelectorComponent;
  @ViewChild('repuestoCrearSelector') repuestoCrearSelector!: SearchSelectorComponent;

  // ====== PROPIEDADES DE EDICIÓN INLINE ======
  editingId: number | null = null;
  editBuffer: Partial<Reparacion> = {};

  // ====== PROPIEDADES DE CREACIÓN ======
  nuevo: Partial<Reparacion> = {
    fecha: new Date().toISOString().slice(0, 10),
    fecha_estimada: null,
    estado: 'pendiente'
  };

  // ====== PROPIEDADES DE MODALES Y REPUESTOS ======
  repuestosDisponibles: any[] = [];
  repuestosAsignados: any[] = [];
  reparacionSeleccionada: Reparacion | null = null;
  mostrarModalRepuestos: boolean = false;
  mostrarModalVerRepuestos: boolean = false;
  cargandoRepuestosDisponibles: boolean = false;
  cargandoRepuestosAsignados: boolean = false;

  // ====== PROPIEDADES PARA REPUESTOS EN CREACIÓN ======
  repuestoSeleccionadoCrear: any = null;
  repuestosSeleccionadosCrear: any[] = [];
  cantidadRepuestoCrear: number = 1;

  private subs: Subscription[] = [];

  constructor(
    private repService: ReparacionService,
    private searchService: SearchService,
    private clienteService: ClienteService,
    private equipoService: EquipoService,
    private usuarioService: UsuarioService,
    private repuestoService: RepuestoService,
    private alertService: AlertService
  ) {}

  // ====== CICLO DE VIDA ======
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

  // ====== CONFIGURACIÓN DE BÚSQUEDA ======
  private configurarBusqueda(): void {
    this.searchService.setCurrentComponent('reparaciones');
    this.searchSub = this.searchService.searchTerm$.subscribe(term => {
      const oldTerm = this.searchTerm;
      this.searchTerm = (term || '').trim();
          
      if (this.searchTerm) {
        this.onBuscarReparaciones(this.searchTerm);
      } else {
        if (oldTerm !== this.searchTerm) {
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

    this.repService.listCompleto(1, this.perPage, termino).subscribe({
      next: (response: PaginatedResponse<Reparacion>) => {
        this.reparacionesAll = response.data;
        this.reparacionesFiltradas = [...this.reparacionesAll];
        
        const itemsForSearch = this.reparacionesAll.map(reparacion => ({
          ...reparacion,
          tecnico_nombre: this.getTecnicoNombre(reparacion),
          equipo_nombre: this.getEquipoNombre(reparacion),
          reparacion_nombre: reparacion.descripcion || 'Sin descripción',
          cliente_nombre: this.getClienteNombre(reparacion)
        }));
        this.searchService.setSearchData(itemsForSearch);
      },
      error: (error) => {
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

  // ====== GESTIÓN DE LISTADO Y SCROLL ======
  cargar() {
    if (this.loading || this.lastPage) return;
    
    this.loading = true;
    
    const searchTerm = this.searchTerm && this.searchTerm.trim() ? this.searchTerm.trim() : '';
    
    this.repService.listCompleto(this.page, this.perPage, searchTerm).subscribe({
      next: (res: PaginatedResponse<Reparacion>) => {
        const nuevasReparaciones = res.data;
        
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
        this.alertService.showGenericError('Error al cargar las reparaciones');
      }
    });
  }

  private prepararDatosParaBusquedaGlobal(): void {
    const itemsForSearch = this.reparacionesAll.map(reparacion => ({
      ...reparacion,
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
        this.loading = false;
        this.serverSearchLastPage = true;
      }
    });
  }

  onScroll = () => {
    if (this.isCrear()) {
      return;
    }
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
    if (r.cliente_nombre && r.cliente_nombre !== 'No especificado') {
      return r.cliente_nombre;
    }

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

  // ====== CREACIÓN DE REPARACIONES ======
  async crear() {
    if (!this.nuevo.equipo_id || !this.nuevo.usuario_id || !this.nuevo.descripcion || !this.nuevo.fecha || !this.nuevo.estado) {
      this.alertService.showGenericError('Completá todos los campos: equipo, técnico, descripción, fecha y estado.');
      return;
    }

    for (const repuesto of this.repuestosSeleccionadosCrear) {
      if (repuesto.cantidad > repuesto.stock) {
        this.alertService.showGenericError(`Stock insuficiente para ${repuesto.nombre}. Solo hay ${repuesto.stock} unidades disponibles.`);
        return;
      }
    }

    this.alertService.showLoading('Creando reparación...');

    try {
      const reparacionCreada = await this.repService.create(this.nuevo).toPromise();
      
      if (!reparacionCreada) {
        throw new Error('No se recibió respuesta del servidor al crear la reparación');
      }

      const nuevaReparacion = reparacionCreada;

      if (!nuevaReparacion) {
        throw new Error('No se recibió la reparación creada');
      }

      if (this.repuestosSeleccionadosCrear.length > 0) {
        for (const repuesto of this.repuestosSeleccionadosCrear) {
          await this.repService.assignRepuesto(nuevaReparacion.id, repuesto.id, repuesto.cantidad).toPromise();
        }
      }

      this.alertService.closeLoading();
      
      this.reparacionesAll.unshift(nuevaReparacion);
      this.applyFilterLocal();

      this.nuevo = {
        fecha: new Date().toISOString().slice(0, 10),
        estado: 'pendiente'
      };
      this.limpiarCliente();
      this.limpiarEquipo();
      this.limpiarTecnico();
      this.repuestosSeleccionadosCrear = [];
      this.repuestoSeleccionadoCrear = null;
      this.cantidadRepuestoCrear = 1;
      
      this.selectedAction = 'listar';
      this.alertService.showReparacionCreada();

    } catch (e: any) {
      this.alertService.closeLoading();
      this.alertService.showGenericError(e?.error?.error ?? 'Error al crear la reparación');
    }
  }

  // ====== ELIMINACIÓN DE REPARACIONES ======
  async eliminar(id: number) {
    const reparacion = this.reparacionesAll.find(r => r.id === id);
    const confirmed = await this.alertService.confirmDeleteReparacion(reparacion?.descripcion || 'esta reparación');
    if (!confirmed) return;

    this.alertService.showLoading('Eliminando reparación...');

    this.repService.delete(id).subscribe({
      next: () => {
        this.alertService.closeLoading();
        this.reparacionesAll = this.reparacionesAll.filter(r => r.id !== id);
        this.applyFilterLocal();
        this.prepararDatosParaBusquedaGlobal();
        this.alertService.showReparacionEliminada();
      },
      error: (e) => {
        this.alertService.closeLoading();
        this.alertService.showGenericError('Error al eliminar la reparación');
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
      fecha_estimada: item.fecha_estimada ? item.fecha_estimada.slice(0, 10) : null,
      estado: item.estado,
    };

    this.precargarDatosEdicion(item);
  }

  private precargarDatosEdicion(item: Reparacion) {
    this.equipoEditSeleccionado = null;
    this.tecnicoEditSeleccionado = null;

    if (item.equipo && item.equipo.cliente) {
      this.clienteEditSeleccionado = {
        id: item.equipo.cliente.id,
        nombre: item.equipo.cliente.nombre,
        email: item.equipo.cliente.email,
        telefono: item.equipo.cliente.telefono
      };
    }

    if (item.equipo) {
      this.equipoEditSeleccionado = {
        id: item.equipo.id,
        descripcion: item.equipo.descripcion,
        marca: item.equipo.marca,
        modelo: item.equipo.modelo,
        nro_serie: item.equipo.nro_serie,
        cliente_id: item.equipo.cliente_id
      };

      this.cargarTodosLosEquiposDelClienteEdit();
    } else {
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
            
            if (equipo.cliente_id) {
              this.clienteService.getCliente(equipo.cliente_id).subscribe({
                next: (cliente) => {
                  this.clienteEditSeleccionado = {
                    id: cliente.id,
                    nombre: cliente.nombre,
                    email: cliente.email,
                    telefono: cliente.telefono
                  };
                  this.cargarTodosLosEquiposDelClienteEdit();
                },
                error: (e) => {}
              });
            }
          },
          error: (e) => {}
        });
      }
    }

    if (item.usuario_id) {
      this.usuarioService.getTecnicos(1, 50).subscribe({
        next: (response: any) => {
          const tecnicos = response.data || response;
          const tecnico = Array.isArray(tecnicos) ? 
            tecnicos.find((t: any) => t.id === item.usuario_id) : 
            null;
          
          if (tecnico) {
            this.tecnicoEditSeleccionado = tecnico;
          }
        },
        error: (e) => {}
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

  async saveEdit(id: number) {
    if (!this.editBuffer.equipo_id || !this.editBuffer.usuario_id || !this.editBuffer.descripcion || !this.editBuffer.fecha || !this.editBuffer.estado) {
      this.alertService.showGenericError('Completá todos los campos: equipo, técnico, descripción, fecha y estado.');
      return;
    }

    this.alertService.showLoading('Actualizando reparación...');

    this.repService.update(id, this.editBuffer).subscribe({
      next: (res: any) => {
        this.alertService.closeLoading();
        const idx = this.reparacionesAll.findIndex(r => r.id === id);
        if (idx >= 0) {
          const reparacionActualizada = {
            ...this.reparacionesAll[idx],
            ...this.editBuffer
          } as Reparacion;
          
          this.reparacionesAll[idx] = reparacionActualizada;
          this.applyFilterLocal();
          this.prepararDatosParaBusquedaGlobal();
        }
        this.cancelEdit();
        this.alertService.showReparacionActualizada();
      },
      error: (e) => {
        this.alertService.closeLoading();
        this.alertService.showGenericError(e?.error?.error ?? 'Error al actualizar la reparación');
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

  // ====== MÉTODOS DE FOCUS ======
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
    
    if (a !== 'crear') {
      this.repuestosSeleccionadosCrear = [];
      this.repuestoSeleccionadoCrear = null;
      this.cantidadRepuestoCrear = 1;
    }
  }

  getEstadoBadgeClass(estado: string): string {
    if (!estado) return 'badge bg-secondary';

    const cleaned = estado.replace('_', ' ').trim().toLowerCase();

    switch (cleaned) {
      case 'pendiente':
        return 'badge bg-warning text-white';
      case 'en proceso':
        return 'badge bg-info text-white';  
      case 'finalizada':
      case 'completado':
        return 'badge bg-success';
      case 'cancelada':
        return 'badge bg-danger'; 
      default:
        return 'badge bg-secondary';
    }
  }

  getEstadoDisplayText(estado: string): string {
    if (!estado) return 'Desconocido';

    const cleaned = estado.replace('_', ' ').trim().toLowerCase();

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
      
      if (this.equipoEditSelector) {
        this.setEquipoEditSelectorMessage('noClient', true);
      }
      return;
    }

    if (this.equipoEditSelector) {
      this.setEquipoEditSelectorMessage('noClient', false);
    }

    this.equipoService.buscarEquiposConFiltro(termino, this.clienteEditSeleccionado.id).subscribe({
      next: (equipos: SearchResult[]) => {
        this.equipoEditSelector?.updateSuggestions(equipos);
        
        if (this.equipoEditSelector && equipos.length === 0 && termino.length >= 2) {
          this.setEquipoEditSelectorMessage('noResults', true);
        } else if (this.equipoEditSelector) {
          this.setEquipoEditSelectorMessage('noResults', false);
          this.setEquipoEditSelectorMessage('noEquipos', false);
        }
      },
      error: (e) => {
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
        
        if (this.equipoEditSelector && equipos.length === 0) {
          this.setEquipoEditSelectorMessage('noEquipos', true);
        } else if (this.equipoEditSelector) {
          this.setEquipoEditSelectorMessage('noEquipos', false);
        }
      },
      error: (e) => {
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

  // ====== VALIDACIÓN DE FORMULARIO ======
  isFormValid(): boolean {
    const camposBasicos = !!(this.clienteSeleccionado && 
                          this.equipoSeleccionado && 
                          this.tecnicoSeleccionado && 
                          this.nuevo.descripcion && 
                          this.nuevo.fecha && 
                          this.nuevo.estado);

    const repuestosValidos = this.repuestosSeleccionadosCrear.every(repuesto => 
      repuesto.cantidad > 0 && repuesto.cantidad <= repuesto.stock
    );

    return camposBasicos && repuestosValidos;
  }

  // ====== MANEJO DE MENSAJES DE EQUIPO ======
  private setEquipoEditSelectorMessage(type: 'noClient' | 'noResults' | 'noEquipos', show: boolean): void {
    if (!this.equipoEditSelector) return;

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

  hasEquipoEditSelectorMessage(): boolean {
    if (!this.equipoEditSelector) return false;
    
    const selector = this.equipoEditSelector as any;
    return selector._showNoClientMessage || selector._showNoResultsMessage || selector._showNoEquiposMessage;
  }

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

  // ====== GESTIÓN DE REPUESTOS ======
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

  // ====== MODALES DE REPUESTOS ======
  abrirModalRepuestos(reparacion: Reparacion): void {
    this.reparacionSeleccionada = reparacion;
    this.mostrarModalRepuestos = true;
    
    this.cargandoRepuestosDisponibles = false;
    this.cargandoRepuestosAsignados = false;
    
    this.cargarRepuestosDisponibles();
    this.cargarRepuestosAsignados(reparacion.id);
  }

  verRepuestosModal(reparacion: Reparacion): void {
    this.reparacionSeleccionada = reparacion;
    this.mostrarModalVerRepuestos = true;
  }

  cerrarModalRepuestos(): void {
    this.mostrarModalRepuestos = false;
    this.reparacionSeleccionada = null;
    this.repuestosDisponibles = [];
    this.repuestosAsignados = [];
  }

  cerrarModalVerRepuestos(): void {
    this.mostrarModalVerRepuestos = false;
    this.reparacionSeleccionada = null;
  }

  // ====== CARGA DE REPUESTOS ======
  cargarRepuestosDisponibles(): void {
    this.cargandoRepuestosDisponibles = true;
    
    this.repuestoService.getRepuestos(1, 100).subscribe({
      next: (response: any) => {
        this.repuestosDisponibles = response.data || response;
        this.repuestosDisponibles.forEach(repuesto => {
          repuesto.cantidadSeleccionada = 1;
        });
        this.cargandoRepuestosDisponibles = false;
      },
      error: (error) => {
        this.cargandoRepuestosDisponibles = false;
        this.alertService.showGenericError('Error al cargar repuestos disponibles');
      }
    });
  }

  cargarRepuestosAsignados(reparacionId: number): void {
    this.cargandoRepuestosAsignados = true;
    
    this.repService.getRepuestosAsignados(reparacionId).subscribe({
      next: (response: any) => {
        this.repuestosAsignados = response.data || response;
        this.cargandoRepuestosAsignados = false;
      },
      error: (error) => {
        this.cargandoRepuestosAsignados = false;
        this.alertService.showGenericError('Error al cargar repuestos asignados');
      }
    });
  }

  // ====== ASIGNACIÓN Y REMOCIÓN DE REPUESTOS ======
  asignarRepuesto(repuesto: any, cantidad?: number): void {
    if (!this.reparacionSeleccionada) return;

    const cantidadFinal = cantidad || repuesto.cantidadSeleccionada || 1;

    if (repuesto.stock < cantidadFinal) {
      this.alertService.showGenericError(`Stock insuficiente. Solo hay ${repuesto.stock} unidades disponibles.`);
      return;
    }

    this.alertService.showLoading('Asignando repuesto...');

    this.repService.assignRepuesto(this.reparacionSeleccionada.id, repuesto.id, cantidadFinal).subscribe({
      next: (response: any) => {
        this.alertService.closeLoading();
        
        const repuestoIndex = this.repuestosDisponibles.findIndex(r => r.id === repuesto.id);
        if (repuestoIndex !== -1) {
          this.repuestosDisponibles[repuestoIndex].stock -= cantidadFinal;
          this.repuestosDisponibles[repuestoIndex].cantidadSeleccionada = 1;
        }

        this.cargarRepuestosAsignados(this.reparacionSeleccionada!.id);
        this.actualizarReparacionEnListado();
        this.alertService.showSuccess('Repuesto asignado correctamente');
      },
      error: (error) => {
        this.alertService.closeLoading();
        this.alertService.showGenericError(error?.error?.error || 'Error al asignar repuesto');
      }
    });
  }

  removerRepuesto(repuestoAsignado: any): void {
    if (!this.reparacionSeleccionada) return;

    this.alertService.showLoading('Removiendo repuesto...');

    this.repService.removeRepuesto(this.reparacionSeleccionada.id, repuestoAsignado.pivot.id).subscribe({
      next: (response: any) => {
        this.alertService.closeLoading();
        
        const repuestoIndex = this.repuestosDisponibles.findIndex(r => r.id === repuestoAsignado.id);
        if (repuestoIndex !== -1) {
          this.repuestosDisponibles[repuestoIndex].stock += repuestoAsignado.pivot.cantidad;
        }

        this.cargarRepuestosAsignados(this.reparacionSeleccionada!.id);
        this.actualizarReparacionEnListado();
        this.alertService.showSuccess('Repuesto removido correctamente');
      },
      error: (error) => {
        this.alertService.closeLoading();
        this.alertService.showGenericError('Error al remover repuesto');
      }
    });
  }

  private actualizarReparacionEnListado(): void {
    if (!this.reparacionSeleccionada) return;

    this.repService.getRepuestosAsignados(this.reparacionSeleccionada.id).subscribe({
      next: (response: any) => {
        const repuestosActualizados = response.data || response;
        
        const indexAll = this.reparacionesAll.findIndex(r => r.id === this.reparacionSeleccionada!.id);
        if (indexAll !== -1) {
          this.reparacionesAll[indexAll].repuestos = repuestosActualizados;
        }
        
        const indexFiltradas = this.reparacionesFiltradas.findIndex(r => r.id === this.reparacionSeleccionada!.id);
        if (indexFiltradas !== -1) {
          this.reparacionesFiltradas[indexFiltradas].repuestos = repuestosActualizados;
        }
      },
      error: (error) => {}
    });
  }

  // ====== REPUESTOS EN CREACIÓN ======
  cargarRepuestosInicialesCrear(): void {
    this.repuestoService.getRepuestos(1, 10).subscribe({
      next: (response: any) => {
        const repuestos = response.data || response;
        const repuestosMostrar = Array.isArray(repuestos) ? repuestos.slice(0, 5) : [];
        this.repuestoCrearSelector.updateSuggestions(repuestosMostrar);
      },
      error: (e) => {
        this.repuestoCrearSelector.updateSuggestions([]);
      }
    });
  }

  buscarRepuestosCrear(termino: string): void {
    if (termino.length < 2) {
      this.repuestoCrearSelector.updateSuggestions([]);
      return;
    }

    this.repuestoService.buscarRepuestos(termino).subscribe({
      next: (repuestos: any[]) => {
        this.repuestoCrearSelector.updateSuggestions(repuestos);
      },
      error: (e) => {
        this.repuestoCrearSelector.updateSuggestions([]);
      }
    });
  }

  seleccionarRepuestoCrear(repuesto: any): void {
    this.repuestoSeleccionadoCrear = repuesto;
    this.cantidadRepuestoCrear = 1;
  }

  limpiarRepuestoCrear(): void {
    this.repuestoSeleccionadoCrear = null;
    this.cantidadRepuestoCrear = 1;
  }

  agregarRepuestoCrear(): void {
    if (!this.repuestoSeleccionadoCrear || !this.cantidadRepuestoCrear || this.cantidadRepuestoCrear < 1) {
      this.alertService.showGenericError('Selecciona un repuesto y una cantidad válida');
      return;
    }

    if (this.cantidadRepuestoCrear > this.repuestoSeleccionadoCrear.stock) {
      this.alertService.showGenericError(`Stock insuficiente. Solo hay ${this.repuestoSeleccionadoCrear.stock} unidades disponibles.`);
      return;
    }

    const existe = this.repuestosSeleccionadosCrear.find(r => r.id === this.repuestoSeleccionadoCrear.id);
    if (existe) {
      this.alertService.showGenericError('Este repuesto ya está en la lista');
      return;
    }

    this.repuestosSeleccionadosCrear.push({
      ...this.repuestoSeleccionadoCrear,
      cantidad: this.cantidadRepuestoCrear
    });

    this.limpiarRepuestoCrear();
    this.repuestoCrearSelector.clearAll();
  }

  removerRepuestoCrear(repuestoId: number): void {
    this.repuestosSeleccionadosCrear = this.repuestosSeleccionadosCrear.filter(r => r.id !== repuestoId);
  }

  // ====== MÉTODOS AUXILIARES ======
  getTextoBotonCrear(): string {
    if (!this.isFormValid()) {
      return 'Completa todos los campos';
    }
    
    const totalRepuestos = this.repuestosSeleccionadosCrear.length;
    if (totalRepuestos > 0) {
      return `Guardar Reparación (${totalRepuestos} repuesto${totalRepuestos !== 1 ? 's' : ''})`;
    }
    
    return 'Guardar Reparación';
  }

  calcularTotalRepuestos(reparacion: Reparacion): number {
    if (!reparacion.repuestos || reparacion.repuestos.length === 0) {
      return 0;
    }
    
    return reparacion.repuestos.reduce((total, repuesto) => {
      const cantidad = repuesto.pivot?.cantidad || 1;
      const costo = repuesto.pivot?.costo_unitario || repuesto.costo_base || 0;
      return total + (cantidad * costo);
    }, 0);
  }
}