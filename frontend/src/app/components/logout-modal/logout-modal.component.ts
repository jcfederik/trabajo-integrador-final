import { Component, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

interface Especializacion {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-logout-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logout-modal.component.html',
  styleUrls: ['./logout-modal.component.css']
})
export class LogoutModalComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();
  
  currentUser = signal<any>(null);
  mostrarConfirmacion = false;

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
}