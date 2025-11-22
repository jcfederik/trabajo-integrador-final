import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

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
export class UsuariosComponent implements OnInit {
  usuarios: User[] = [];
  mostrarFormulario = false;
  editandoUsuario: User | null = null; // ✅ NUEVO: Para saber qué usuario estamos editando
  
  // ✅ NUEVO: Formulario de edición
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

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.http.get<any>('http://127.0.0.1:8000/api/users').subscribe({
      next: (response) => {
        this.usuarios = response.data || [];
      },
      error: (error) => {
        console.error('Error cargando usuarios:', error);
        alert('Error al cargar usuarios');
      }
    });
  }

  crearUsuario() {
    this.http.post('http://127.0.0.1:8000/api/users', this.nuevoUsuario).subscribe({
      next: (response: any) => {
        this.mostrarFormulario = false;
        this.nuevoUsuario = { nombre: '', tipo: 'usuario', password: '' };
        this.cargarUsuarios();
        alert('Usuario creado exitosamente');
      },
      error: (error) => {
        console.error('Error creando usuario:', error);
        alert(error.error?.message || 'Error al crear usuario');
      }
    });
  }

  eliminarUsuario(id: number) {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    this.http.delete(`http://127.0.0.1:8000/api/users/${id}`).subscribe({
      next: () => {
        this.cargarUsuarios();
        alert('Usuario eliminado exitosamente');
      },
      error: (error) => {
        console.error('Error eliminando usuario:', error);
        alert(error.error?.message || 'Error al eliminar usuario');
      }
    });
  }

  cancelarCreacion() {
    this.mostrarFormulario = false;
    this.nuevoUsuario = { nombre: '', tipo: 'usuario', password: '' };
  }

  // ✅ NUEVO: Método para iniciar edición
  iniciarEdicion(usuario: User) {
    this.editandoUsuario = usuario;
    this.usuarioEditado = {
      nombre: usuario.nombre,
      tipo: usuario.tipo,
      password: '' // Dejamos vacío para no mostrar la contraseña actual
    };
  }

  // ✅ NUEVO: Método para cancelar edición
  cancelarEdicion() {
    this.editandoUsuario = null;
    this.usuarioEditado = { nombre: '', tipo: 'usuario', password: '' };
  }

  // ✅ NUEVO: Método para guardar edición
  guardarEdicion() {
    if (!this.editandoUsuario) return;

    const payload: any = {
      nombre: this.usuarioEditado.nombre,
      tipo: this.usuarioEditado.tipo
    };

    // Solo incluir password si se proporcionó uno nuevo
    if (this.usuarioEditado.password) {
      payload.password = this.usuarioEditado.password;
    }

    this.http.put(`http://127.0.0.1:8000/api/users/${this.editandoUsuario.id}`, payload).subscribe({
      next: (response: any) => {
        // Actualizar el usuario en la lista local
        const index = this.usuarios.findIndex(u => u.id === this.editandoUsuario!.id);
        if (index !== -1) {
          this.usuarios[index] = { ...this.usuarios[index], ...response.data };
        }
        
        this.cancelarEdicion();
        alert('Usuario actualizado exitosamente');
      },
      error: (error) => {
        console.error('Error actualizando usuario:', error);
        alert(error.error?.message || 'Error al actualizar usuario');
      }
    });
  }
}