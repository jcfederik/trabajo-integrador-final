import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AlertService } from '../../services/alert.service';
import { SearchService } from '../../services/busquedaglobal';
import { Subscription } from 'rxjs';

interface User {
  id: number;
  nombre: string;
  tipo: string;
  especializaciones?: any[];
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit, OnDestroy {
  usuarios: User[] = [];
  mostrarFormulario = false;
  editandoUsuario: User | null = null;
  
  private searchSub!: Subscription;

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
    private searchService: SearchService
  ) {}

  ngOnInit() {
    this.cargarUsuarios();
    this.configurarBusquedaGlobal();
  }

  ngOnDestroy() {
    if (this.searchSub) {
      this.searchSub.unsubscribe();
    }
    this.searchService.clearSearch();
  }

  private configurarBusquedaGlobal(): void {
    this.searchService.setCurrentComponent('usuarios');
    
    this.searchSub = this.searchService.searchTerm$.subscribe(term => {
      if (term) {
        this.searchService.clearSearch();
      }
    });
  }

  cargarUsuarios() {
    this.http.get<any>('http://127.0.0.1:8000/api/users').subscribe({
      next: (response) => {
        this.usuarios = response.data || [];
        this.searchService.setSearchData([]);
      },
      error: (error) => {
        this.alertService.showGenericError('Error al cargar usuarios');
      }
    });
  }

  async crearUsuario() {
    if (!this.nuevoUsuario.nombre || !this.nuevoUsuario.password) {
      this.alertService.showRequiredFieldError('nombre y contraseña');
      return;
    }

    this.alertService.showLoading('Creando usuario...');

    this.http.post('http://127.0.0.1:8000/api/users', this.nuevoUsuario).subscribe({
      next: (response: any) => {
        this.alertService.closeLoading();
        this.mostrarFormulario = false;
        this.nuevoUsuario = { nombre: '', tipo: 'usuario', password: '' };
        this.cargarUsuarios();
        this.alertService.showSuccess('Usuario creado exitosamente');
      },
      error: (error) => {
        this.alertService.closeLoading();
        this.alertService.showGenericError(error.error?.message || 'Error al crear usuario');
      }
    });
  }

  async eliminarUsuario(id: number, usuarioNombre: string) {
    const usuario = this.usuarios.find(u => u.id === id);
    if (usuario?.tipo === 'administrador') {
      this.alertService.showError('No se puede eliminar', 'Los usuarios administradores no pueden ser eliminados');
      return;
    }

    const confirmed = await this.alertService.confirmDelete('usuario', usuarioNombre);
    if (!confirmed) return;

    this.alertService.showLoading('Eliminando usuario...');

    this.http.delete(`http://127.0.0.1:8000/api/users/${id}`).subscribe({
      next: () => {
        this.alertService.closeLoading();
        this.cargarUsuarios();
        this.alertService.showDeleteSuccess('usuario', usuarioNombre);
      },
      error: (error) => {
        this.alertService.closeLoading();
        this.alertService.showGenericError(error.error?.message || 'Error al eliminar usuario');
      }
    });
  }

  cancelarCreacion() {
    this.mostrarFormulario = false;
    this.nuevoUsuario = { nombre: '', tipo: 'usuario', password: '' };
  }

  iniciarEdicion(usuario: User) {
    this.editandoUsuario = usuario;
    this.usuarioEditado = {
      nombre: usuario.nombre,
      tipo: usuario.tipo,
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