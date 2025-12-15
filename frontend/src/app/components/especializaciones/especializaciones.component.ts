import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { AlertService } from '../../services/alert.service';

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
    public authService: AuthService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.verificarPermisos();
    this.cargarEspecializaciones();
    this.cargarTecnicos();
  }

  // VERIFICAR PERMISOS
  private verificarPermisos(): void {
    if (!this.authService.isAuthenticated()) {
      this.alertService.showError('Acceso denegado', 'Debes iniciar sesión para acceder a esta página');
      this.router.navigate(['/login']);
      return;
    }

    if (!this.authService.canViewEspecializaciones()) {
      this.alertService.showError('Permisos insuficientes', 'No tienes permisos para acceder a la gestión de especializaciones');
      this.router.navigate(['/dashboard']);
      return;
    }
  }

  private puedeCrearOEditar(): boolean {
    return this.authService.canManageEspecializaciones() || 
           this.authService.hasPermission('especializaciones.create');
  }

  private puedeEliminar(): boolean {
    return this.authService.canManageEspecializaciones();
  }

  private puedeAsignarTecnicos(): boolean {
    return this.authService.canAssignEspecializaciones();
  }

  // CARGAR ESPECIALIZACIONES
  cargarEspecializaciones() {
    this.http.get<any>('http://127.0.0.1:8000/api/especializaciones').subscribe({
      next: (response) => {
        this.especializaciones = response.data || [];
      },
      error: (error) => {
        if (error.status === 403) {
          this.alertService.showError('Permisos insuficientes', 'No tienes permisos para ver las especializaciones');
          this.router.navigate(['/dashboard']);
        } else if (error.status === 401) {
          this.alertService.showError('Sesión expirada', 'Por favor, inicia sesión nuevamente.');
          this.authService.logout();
          this.router.navigate(['/login']);
        } else {
          this.alertService.showGenericError('Error al cargar especializaciones');
        }
      }
    });
  }

  // CARGAR TÉCNICOS
  cargarTecnicos() {
    this.http.get<any>('http://127.0.0.1:8000/api/usuarios').subscribe({
      next: (response) => {
        this.tecnicos = (response.data || []).filter((user: Tecnico) =>
          user.tipo === 'tecnico' || user.tipo === 'administrador'
        );
      },
      error: (error) => {
        if (error.status === 403) {}
      }
    });
  }

  // CREAR ESPECIALIZACIÓN
  crearEspecializacion() {
    if (!this.puedeCrearOEditar()) {
      this.alertService.showError('Permisos insuficientes', 'No tienes permisos para crear especializaciones');
      return;
    }

    if (!this.nuevaEspecializacion.nombre.trim()) {
      this.alertService.showValidationError('nombre');
      return;
    }

    this.http.post('http://127.0.0.1:8000/api/especializaciones', this.nuevaEspecializacion).subscribe({
      next: () => {
        this.mostrarFormulario = false;
        this.nuevaEspecializacion = { nombre: '' };
        this.cargarEspecializaciones();
        this.alertService.showCreateSuccess('Especialización');
      },
      error: (error) => {
        if (error.status === 403) {
          this.alertService.showError('Permisos insuficientes', 'No tienes permisos para crear especializaciones');
        } else {
          this.alertService.showGenericError('Error al crear especialización');
        }
      }
    });
  }

  // INICIAR EDICIÓN
  iniciarEdicion(especializacion: Especializacion) {
    if (!this.puedeCrearOEditar()) {
      this.alertService.showError('Permisos insuficientes', 'No tienes permisos para editar especializaciones');
      return;
    }

    this.editandoEspecializacion = especializacion;
    this.especializacionEditada = { nombre: especializacion.nombre };
  }

  // GUARDAR EDICIÓN
  guardarEdicion() {
    if (!this.editandoEspecializacion || !this.puedeCrearOEditar()) return;

    if (!this.especializacionEditada.nombre.trim()) {
      this.alertService.showValidationError('nombre');
      return;
    }

    this.http.put(`http://127.0.0.1:8000/api/especializaciones/${this.editandoEspecializacion.id}`, this.especializacionEditada).subscribe({
      next: (response: any) => {
        const index = this.especializaciones.findIndex(e => e.id === this.editandoEspecializacion!.id);
        if (index !== -1) {
          this.especializaciones[index] = { ...this.especializaciones[index], ...response.data };
        }
        this.cancelarEdicion();
        this.alertService.showUpdateSuccess('Especialización');
      },
      error: (error) => {
        if (error.status === 403) {
          this.alertService.showError('Permisos insuficientes', 'No tienes permisos para editar especializaciones');
        } else {
          this.alertService.showGenericError('Error al actualizar especialización');
        }
      }
    });
  }

  // CANCELAR EDICIÓN
  cancelarEdicion() {
    this.editandoEspecializacion = null;
    this.especializacionEditada = { nombre: '' };
  }

  // ELIMINAR ESPECIALIZACIÓN
  async eliminarEspecializacion(id: number) {
    if (!this.puedeEliminar()) return;

    const confirmado = await this.alertService.confirmDelete('especialización');
    if (!confirmado) return;

    this.http.delete(`http://127.0.0.1:8000/api/especializaciones/${id}`).subscribe({
      next: () => {
        this.cargarEspecializaciones();
        this.alertService.showDeleteSuccess('Especialización');
      },
      error: (error) => {
        if (error.status === 403) {
          this.alertService.showError('Permisos insuficientes', 'No tienes permisos para eliminar especializaciones');
        } else {
          this.alertService.showGenericError('Error al eliminar especialización');
        }
      }
    });
  }

  // INICIAR ASIGNACIÓN
  iniciarAsignacion(especializacion: Especializacion) {
    if (!this.puedeAsignarTecnicos()) return;

    this.asignandoTecnicos = especializacion;
    this.cargarTecnicosAsignados(especializacion.id);
  }

  // CARGAR TÉCNICOS ASIGNADOS
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
      },
      error: (error) => {}
    });
  }

  // GUARDAR ASIGNACIÓN
  async guardarAsignacion() {
    if (!this.asignandoTecnicos || !this.puedeAsignarTecnicos()) return;

    try {
      const asignaciones = this.tecnicosSeleccionados.map(tecnicoId =>
        this.asignarEspecializacionAdmin(tecnicoId, this.asignandoTecnicos!.id)
      );

      await Promise.all(asignaciones);

      this.asignandoTecnicos = null;
      this.tecnicosSeleccionados = [];
      this.cargarEspecializaciones();
      this.cargarTecnicos();
      this.alertService.showSuccess('Técnicos asignados exitosamente');

    } catch (error) {
      this.alertService.showGenericError('Error al asignar técnicos');
    }
  }

  // ASIGNAR ESPECIALIZACIÓN ADMIN
  asignarEspecializacionAdmin(tecnicoId: number, especializacionId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.post(`http://127.0.0.1:8000/api/admin/users/${tecnicoId}/especializaciones`, {
        especializaciones: [especializacionId]
      }).subscribe({
        next: () => resolve(),
        error: (error) => {
          if (error.status === 403) {
            this.alertService.showError('Permisos insuficientes', 'No tienes permisos de administrador para asignar especializaciones');
          }
          reject(error);
        }
      });
    });
  }

  // CANCELAR ASIGNACIÓN
  cancelarAsignacion() {
    this.asignandoTecnicos = null;
    this.tecnicosSeleccionados = [];
  }

  // TOGGLE TÉCNICO
  toggleTecnico(tecnicoId: number) {
    const index = this.tecnicosSeleccionados.indexOf(tecnicoId);
    if (index > -1) {
      this.tecnicosSeleccionados.splice(index, 1);
    } else {
      this.tecnicosSeleccionados.push(tecnicoId);
    }
  }

  // ESTÁ SELECCIONADO
  estaSeleccionado(tecnicoId: number): boolean {
    return this.tecnicosSeleccionados.includes(tecnicoId);
  }

  // CANCELAR CREACIÓN
  cancelarCreacion() {
    this.mostrarFormulario = false;
    this.nuevaEspecializacion = { nombre: '' };
  }

  // CONTAR TÉCNICOS POR ESPECIALIZACIÓN
  contarTecnicosPorEspecializacion(especializacionId: number): number {
    if (!especializacionId) return 0;
    
    return this.tecnicos.filter(tecnico =>
      tecnico.especializaciones &&
      tecnico.especializaciones.some(esp => esp.id === especializacionId)
    ).length;
  }

  // AUTO ASIGNAR ESPECIALIZACIÓN
  autoAsignarEspecializacion(especializacionId: number): void {
    if (!this.authService.canSelfAssignEspecializaciones()) {
      this.alertService.showError('Permisos insuficientes', 'No tienes permisos para auto-asignarte especializaciones');
      return;
    }

    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) {
      this.alertService.showGenericError('No se pudo identificar tu usuario');
      return;
    }

    this.http.post(`http://127.0.0.1:8000/api/users/${userId}/especializaciones`, {
      especializaciones: [especializacionId]
    }).subscribe({
      next: () => {
        this.alertService.showSuccess('Especialización auto-asignada correctamente');
        this.cargarTecnicos();
      },
      error: (error) => {
        this.alertService.showGenericError('Error al auto-asignar especialización');
      }
    });
  }
}