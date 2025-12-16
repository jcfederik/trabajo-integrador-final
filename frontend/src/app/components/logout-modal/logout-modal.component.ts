import { Component, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

interface Especializacion {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-logout-modal',
  standalone: true,
  imports: [CommonModule, TitleCasePipe],
  templateUrl: './logout-modal.component.html',
  styleUrls: ['./logout-modal.component.css']
})
export class LogoutModalComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();
  
  currentUser = signal<any>(null);
  mostrarConfirmacion = false;

  // Variables computadas para controlar la vista
  mostrarEspecializaciones = computed(() => {
    const user = this.currentUser();
    return user && user.tipo !== 'usuario';
  });

  esAdministrador = computed(() => {
    const user = this.currentUser();
    return user && user.tipo === 'administrador';
  });

  esTecnico = computed(() => {
    const user = this.currentUser();
    return user && user.tipo === 'tecnico';
  });

  tieneEspecializaciones = computed(() => {
    const user = this.currentUser();
    return user && 
           user.especializaciones && 
           Array.isArray(user.especializaciones) && 
           user.especializaciones.length > 0;
  });

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarDatosUsuario();
  }

  // CARGAR DATOS USUARIO
  cargarDatosUsuario() {
    const user = this.authService.getCurrentUser();
    this.currentUser.set(user);
  }

  // MOSTRAR LOGOUT
  mostrarLogout() {
    this.mostrarConfirmacion = true;
  }

  // VOLVER AL PERFIL
  volverAlPerfil() {
    this.mostrarConfirmacion = false;
  }

  // IR A ESPECIALIZACIONES
  irAEspecializaciones() {
    this.closed.emit();
    this.router.navigate(['/especializaciones']);
  }

  // CONFIRMAR LOGOUT
  confirmarLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.closed.emit();
  }

  // CANCELAR
  cancelar() {
    this.closed.emit();
  }

  // Método helper
  getTipoUsuarioColor(tipo: string): string {
    switch (tipo?.toLowerCase()) {
      case 'administrador':
        return 'danger'; 
      case 'tecnico':
        return 'primary'; 
      case 'secretario':
        return 'success'; 
      case 'usuario':
        return 'secondary';
      default:
        return 'secondary';
    }
  }

  // Método para obtener icono según tipo de usuario
  getTipoUsuarioIcono(tipo: string): string {
    switch (tipo?.toLowerCase()) {
      case 'administrador':
        return 'bi-shield-check';
      case 'tecnico':
        return 'bi-tools';
      case 'secretario':
        return 'bi-person-badge';
      case 'usuario':
        return 'bi-person';
      default:
        return 'bi-person';
    }
  }
}