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

  cargarDatosUsuario() {
    // Usar getCurrentUser que ya existe en tu AuthService
    const user = this.authService.getCurrentUser();
    this.currentUser.set(user);
    
    console.log('🔍 Usuario en modal:', user);
    console.log('🎯 Especializaciones:', user?.especializaciones);
  }

  // Mostrar confirmación de logout
  mostrarLogout() {
    this.mostrarConfirmacion = true;
  }

  // Volver al perfil
  volverAlPerfil() {
    this.mostrarConfirmacion = false;
  }

  // Ir a la página de especializaciones
  irAEspecializaciones() {
    this.closed.emit();
    this.router.navigate(['/especializaciones']);
  }

  confirmarLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.closed.emit();
  }

  cancelar() {
    this.closed.emit();
  }
}