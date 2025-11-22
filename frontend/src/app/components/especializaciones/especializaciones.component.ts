import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

interface Especializacion {
  id: number;
  nombre: string;
  created_at?: string;
  updated_at?: string;
}

interface Tecnico {
  id: number;
  nombre: string;
  tipo: string;
  especializaciones?: Especializacion[];
}

@Component({
  selector: 'app-especializaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './especializaciones.component.html',
  styleUrls: ['./especializaciones.component.css']
})
export class EspecializacionesComponent implements OnInit {
  especializaciones: Especializacion[] = [];
  tecnicos: Tecnico[] = [];
  mostrarFormulario = false;
  editandoEspecializacion: Especializacion | null = null;
  asignandoTecnicos: Especializacion | null = null;

  nuevaEspecializacion = {
    nombre: ''
  };

  especializacionEditada = {
    nombre: ''
  };

  tecnicosSeleccionados: number[] = [];

  constructor(
    private http: HttpClient,
    private router: Router,
    public authService: AuthService
  ) { }

  ngOnInit() {
    this.verificarPermisos();
    this.cargarEspecializaciones();
    this.cargarTecnicos();
  }

  private verificarPermisos(): void {
    this.authService.debugAuthState();

    if (!this.authService.isAuthenticated()) {
      alert('Debes iniciar sesión para acceder a esta página');
      this.router.navigate(['/login']);
      return;
    }

    if (!this.authService.canViewEspecializaciones()) {
      alert('No tienes permisos para acceder a la gestión de especializaciones');
      this.router.navigate(['/dashboard']);
      return;
    }

    console.log('✅ Usuario tiene permisos para ver especializaciones');
  }

  // ✅ CORREGIDO: Técnicos pueden crear/editar pero no eliminar
  private puedeCrearOEditar(): boolean {
    const puede = this.authService.canManageEspecializaciones() || 
                  this.authService.hasPermission('especializaciones.create');
    if (!puede) {
      alert('No tienes permisos para realizar esta acción');
    }
    return puede;
  }

  // ✅ CORREGIDO: Solo administradores pueden eliminar
  private puedeEliminar(): boolean {
    const puede = this.authService.canManageEspecializaciones(); // Solo admin tiene 'especializaciones.manage'
    if (!puede) {
      // ❌ REMOVIDO: No mostrar alerta para eliminar si no tiene permisos
      return false;
    }
    return puede;
  }

  // ✅ CORREGIDO: Solo administradores pueden asignar a otros
  private puedeAsignarTecnicos(): boolean {
    const puede = this.authService.canAssignEspecializaciones();
    if (!puede) {
      // ❌ REMOVIDO: No mostrar alerta para asignar si no tiene permisos
      return false;
    }
    return puede;
  }

  cargarEspecializaciones() {
    console.log('🔍 Cargando especializaciones...');
    
    this.http.get<any>('http://127.0.0.1:8000/api/especializaciones').subscribe({
      next: (response) => {
        this.especializaciones = response.data || [];
        console.log(`✅ Especializaciones cargadas: ${this.especializaciones.length}`);
      },
      error: (error) => {
        console.error('❌ Error cargando especializaciones:', error);
        
        if (error.status === 403) {
          alert('No tienes permisos para ver las especializaciones');
          this.router.navigate(['/dashboard']);
        } else if (error.status === 401) {
          alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
          this.authService.logout();
          this.router.navigate(['/login']);
        } else {
          alert('Error al cargar especializaciones: ' + (error.error?.message || error.message));
        }
      }
    });
  }

  cargarTecnicos() {
    this.http.get<any>('http://127.0.0.1:8000/api/users').subscribe({
      next: (response) => {
        this.tecnicos = (response.data || []).filter((user: Tecnico) =>
          user.tipo === 'tecnico' || user.tipo === 'administrador'
        );
        console.log(`✅ Técnicos cargados: ${this.tecnicos.length}`);
      },
      error: (error) => {
        console.error('❌ Error cargando técnicos:', error);
        
        // ❌ REMOVIDO: No mostrar alerta si no puede ver técnicos
        // Solo log en consola
        if (error.status === 403) {
          console.warn('Usuario no tiene permisos para ver los técnicos');
        }
      }
    });
  }

  crearEspecializacion() {
    if (!this.puedeCrearOEditar()) return;

    if (!this.nuevaEspecializacion.nombre.trim()) {
      alert('Por favor ingresa un nombre para la especialización');
      return;
    }

    console.log('📝 Creando especialización:', this.nuevaEspecializacion);

    this.http.post('http://127.0.0.1:8000/api/especializaciones', this.nuevaEspecializacion).subscribe({
      next: (response: any) => {
        this.mostrarFormulario = false;
        this.nuevaEspecializacion = { nombre: '' };
        this.cargarEspecializaciones();
        alert('✅ Especialización creada exitosamente');
      },
      error: (error) => {
        console.error('❌ Error creando especialización:', error);
        
        if (error.status === 403) {
          alert('No tienes permisos para crear especializaciones');
        } else {
          alert(error.error?.message || 'Error al crear especialización');
        }
      }
    });
  }

  iniciarEdicion(especializacion: Especializacion) {
    if (!this.puedeCrearOEditar()) return;

    this.editandoEspecializacion = especializacion;
    this.especializacionEditada = { nombre: especializacion.nombre };
  }

  guardarEdicion() {
    if (!this.editandoEspecializacion || !this.puedeCrearOEditar()) return;

    if (!this.especializacionEditada.nombre.trim()) {
      alert('Por favor ingresa un nombre para la especialización');
      return;
    }

    this.http.put(`http://127.0.0.1:8000/api/especializaciones/${this.editandoEspecializacion.id}`, this.especializacionEditada).subscribe({
      next: (response: any) => {
        const index = this.especializaciones.findIndex(e => e.id === this.editandoEspecializacion!.id);
        if (index !== -1) {
          this.especializaciones[index] = { ...this.especializaciones[index], ...response.data };
        }
        this.cancelarEdicion();
        alert('✅ Especialización actualizada exitosamente');
      },
      error: (error) => {
        console.error('❌ Error actualizando especialización:', error);
        
        if (error.status === 403) {
          alert('No tienes permisos para editar especializaciones');
        } else {
          alert(error.error?.message || 'Error al actualizar especialización');
        }
      }
    });
  }

  cancelarEdicion() {
    this.editandoEspecializacion = null;
    this.especializacionEditada = { nombre: '' };
  }

  eliminarEspecializacion(id: number) {
    if (!this.puedeEliminar()) return;

    if (!confirm('¿Estás seguro de eliminar esta especialización?')) return;

    this.http.delete(`http://127.0.0.1:8000/api/especializaciones/${id}`).subscribe({
      next: () => {
        this.cargarEspecializaciones();
        alert('✅ Especialización eliminada exitosamente');
      },
      error: (error) => {
        console.error('❌ Error eliminando especialización:', error);
        
        if (error.status === 403) {
          alert('No tienes permisos para eliminar especializaciones');
        } else {
          alert(error.error?.message || 'Error al eliminar especialización');
        }
      }
    });
  }

  iniciarAsignacion(especializacion: Especializacion) {
    if (!this.puedeAsignarTecnicos()) return;

    this.asignandoTecnicos = especializacion;
    this.cargarTecnicosAsignados(especializacion.id);
  }

  cargarTecnicosAsignados(especializacionId: number) {
    this.http.get<any>('http://127.0.0.1:8000/api/users').subscribe({
      next: (response) => {
        const usuarios = response.data || [];
        this.tecnicosSeleccionados = [];

        usuarios.forEach((usuario: any) => {
          if (usuario.especializaciones &&
            usuario.especializaciones.some((esp: any) => esp.id === especializacionId) &&
            (usuario.tipo === 'tecnico' || usuario.tipo === 'administrador')) {
            this.tecnicosSeleccionados.push(usuario.id);
          }
        });
        
        console.log(`👥 Técnicos asignados cargados: ${this.tecnicosSeleccionados.length}`);
      },
      error: (error) => {
        console.error('❌ Error cargando técnicos asignados:', error);
      }
    });
  }

  async guardarAsignacion() {
    if (!this.asignandoTecnicos || !this.puedeAsignarTecnicos()) return;

    try {
      console.log(`🔄 Asignando ${this.tecnicosSeleccionados.length} técnicos...`);

      const asignaciones = this.tecnicosSeleccionados.map(tecnicoId =>
        this.asignarEspecializacionAdmin(tecnicoId, this.asignandoTecnicos!.id)
      );

      await Promise.all(asignaciones);

      this.asignandoTecnicos = null;
      this.tecnicosSeleccionados = [];
      this.cargarEspecializaciones();
      this.cargarTecnicos();
      alert('✅ Técnicos asignados exitosamente');

    } catch (error) {
      console.error('❌ Error asignando técnicos:', error);
      alert('Error al asignar técnicos');
    }
  }

  asignarEspecializacionAdmin(tecnicoId: number, especializacionId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.post(`http://127.0.0.1:8000/api/admin/users/${tecnicoId}/especializaciones`, {
        especializaciones: [especializacionId]
      }).subscribe({
        next: () => {
          console.log(`✅ Técnico ${tecnicoId} asignado a especialización ${especializacionId}`);
          resolve();
        },
        error: (error) => {
          console.error(`❌ Error asignando especialización al técnico ${tecnicoId}:`, error);
          
          if (error.status === 403) {
            alert('No tienes permisos de administrador para asignar especializaciones');
          }
          reject(error);
        }
      });
    });
  }

  cancelarAsignacion() {
    this.asignandoTecnicos = null;
    this.tecnicosSeleccionados = [];
  }

  toggleTecnico(tecnicoId: number) {
    const index = this.tecnicosSeleccionados.indexOf(tecnicoId);
    if (index > -1) {
      this.tecnicosSeleccionados.splice(index, 1);
    } else {
      this.tecnicosSeleccionados.push(tecnicoId);
    }
  }

  estaSeleccionado(tecnicoId: number): boolean {
    return this.tecnicosSeleccionados.includes(tecnicoId);
  }

  cancelarCreacion() {
    this.mostrarFormulario = false;
    this.nuevaEspecializacion = { nombre: '' };
  }

  contarTecnicosPorEspecializacion(especializacionId: number): number {
    if (!especializacionId) return 0;
    
    return this.tecnicos.filter(tecnico =>
      tecnico.especializaciones &&
      tecnico.especializaciones.some(esp => esp.id === especializacionId)
    ).length;
  }

  // ✅ MÉTODO PARA AUTO-ASIGNACIÓN (PARA TÉCNICOS)
  autoAsignarEspecializacion(especializacionId: number): void {
    if (!this.authService.canSelfAssignEspecializaciones()) {
      alert('No tienes permisos para auto-asignarte especializaciones');
      return;
    }

    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) {
      alert('No se pudo identificar tu usuario');
      return;
    }

    this.http.post(`http://127.0.0.1:8000/api/users/${userId}/especializaciones`, {
      especializaciones: [especializacionId]
    }).subscribe({
      next: () => {
        alert('✅ Especialización auto-asignada correctamente');
        this.cargarTecnicos(); // Recargar para ver cambios
      },
      error: (error) => {
        console.error('❌ Error auto-asignando especialización:', error);
        alert(error.error?.message || 'Error al auto-asignar especialización');
      }
    });
  }
}