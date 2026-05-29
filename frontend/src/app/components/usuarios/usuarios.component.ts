import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AlertService } from '../../services/alert.service';
import { UsuarioService } from '../../services/usuario.service';
import { Usuario } from '../../services/usuario.service';


@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  mostrarFormulario = false;
  editandoUsuario: Usuario | null = null;
  

  usuarioEditado = {
    nombre: '',
    tipo: 'usuario',
    password: ''
  };

  nuevoUsuario = {
    nombre: '',
    tipo: 'usuario',
    password: ''
  };

  constructor(
    private http: HttpClient,
    private alertService: AlertService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit() {
    this.cargarUsuarios();
  }


  cargarUsuarios() {
    this.usuarioService.getUsuariosPaginados(1, 50).subscribe({
      next: response => {
        this.usuarios = response.data;
      },
      error: () => {
        this.alertService.showGenericError('Error al cargar usuarios');
      }
    });
  }

    async eliminarUsuario(id: number, usuarioNombre: string) {
    const usuario = this.usuarios.find(u => u.id === id);

    if (usuario?.tipo === 'administrador') {
      this.alertService.showError(
        'No permitido',
        'Los usuarios administradores no pueden ser eliminados'
      );
      return;
    }

    const confirmed = await this.alertService.confirmDelete('usuario', usuarioNombre);
    if (!confirmed) return;

    this.alertService.showLoading('Eliminando usuario...');

    this.usuarioService.deleteUsuario(id).subscribe({
      next: () => {
        this.alertService.closeLoading();
        this.cargarUsuarios();
        this.alertService.showDeleteSuccess('usuario', usuarioNombre);
      },
      error: (error) => {
        this.alertService.closeLoading();
        this.alertService.showGenericError(
          error.error?.message || 'Error al eliminar usuario'
        );
      }
    });
  }


  // CREACIÓN DE USUARIO
  async crearUsuario() {
  if (!this.nuevoUsuario.nombre || !this.nuevoUsuario.password) {
    this.alertService.showRequiredFieldError('nombre y contraseña');
    return;
  }

  this.alertService.showLoading('Creando usuario...');

  this.usuarioService.crearUsuario(this.nuevoUsuario).subscribe({
    next: (usuario) => {
      this.alertService.closeLoading();

      // Reset formulario
      this.mostrarFormulario = false;
      this.nuevoUsuario = {
        nombre: '',
        tipo: 'usuario',
        password: ''
      };

      // Recargar listado
      this.cargarUsuarios();

      this.alertService.showSuccess(
        `Usuario "${usuario.nombre ?? usuario.name}" creado exitosamente`
      );
    },
    error: (error) => {
      this.alertService.closeLoading();
      this.alertService.showGenericError(
        error.error?.message || 'Error al crear usuario'
      );
    }
  });
}




  // GESTIÓN DEL FORMULARIO DE CREACIÓN
  cancelarCreacion() {
    this.mostrarFormulario = false;
    this.nuevoUsuario = { nombre: '', tipo: 'usuario', password: '' };
  }

  // EDICIÓN DE USUARIO
  iniciarEdicion(usuario: Usuario) {
    this.editandoUsuario = usuario;
    this.usuarioEditado = {
      nombre: usuario.nombre ?? usuario.name ?? '',
      tipo: usuario.tipo ?? 'usuario',
      password: ''
    };
  }


  cancelarEdicion() {
    this.editandoUsuario = null;
    this.usuarioEditado = { nombre: '', tipo: 'usuario', password: '' };
  }

  async guardarEdicion() {
    if (!this.editandoUsuario) return;

    if (!this.usuarioEditado.nombre) {
      this.alertService.showRequiredFieldError('nombre');
      return;
    }

    const payload: any = {
      nombre: this.usuarioEditado.nombre,
      tipo: this.usuarioEditado.tipo
    };

    if (this.usuarioEditado.password) {
      payload.password = this.usuarioEditado.password;
    }

    this.alertService.showLoading('Actualizando usuario...');

    this.http.put(`http://127.0.0.1:8000/api/users/${this.editandoUsuario.id}`, payload).subscribe({
      next: (response: any) => {
        this.alertService.closeLoading();
        const index = this.usuarios.findIndex(u => u.id === this.editandoUsuario!.id);
        if (index !== -1) {
          this.usuarios[index] = { ...this.usuarios[index], ...response.data };
        }
        
        this.cancelarEdicion();
        this.alertService.showUpdateSuccess('usuario', this.usuarioEditado.nombre);
      },
      error: (error) => {
        this.alertService.closeLoading();
        this.alertService.showGenericError(error.error?.message || 'Error al actualizar usuario');
      }
    });
  }
}