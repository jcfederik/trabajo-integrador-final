import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  // =============== ESTADOS DEL COMPONENTE ===============
  loading = false;
  error: string | null = null;
  showPassword = false;
  rememberMe = false;

  constructor(
    private auth: AuthService, 
    private router: Router, 
    private cdr: ChangeDetectorRef
  ) {
    this.checkRememberedUser();
  }

  // =============== MÉTODO PRINCIPAL ===============
  login(form: NgForm) {
    form.form.markAllAsTouched();

    if (!form.valid) {
      this.error = 'Por favor, completa todos los campos correctamente.';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    const { nombre, password } = form.value;

    if (this.rememberMe) {
      localStorage.setItem('rememberedUser', nombre);
    } else {
      localStorage.removeItem('rememberedUser');
    }

    this.auth.login(nombre, password).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));

        this.loading = false;
        this.cdr.markForCheck();
        
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 500);
      },
      error: (error) => {
        this.loading = false;
        this.handleError(error);
        this.cdr.markForCheck();
      },
    });
  }

  // =============== MANEJO DE ERRORES ===============
  private handleError(error: any) {
    if (error.status === 401) {
      this.error = 'Credenciales inválidas. Verificá tu usuario y contraseña.';
    } else if (error.status === 0) {
      this.error = 'No se puede conectar con el servidor. Verificá tu conexión.';
    } else if (error.status >= 500) {
      this.error = 'Error interno del servidor. Intentalo nuevamente en unos minutos.';
    } else if (error.status === 429) {
      this.error = 'Demasiados intentos. Esperá unos minutos antes de intentar nuevamente.';
    } else {
      this.error = 'Error inesperado. Por favor, intentá nuevamente.';
    }
  }

  // =============== RECORDAR USUARIO ===============
  private checkRememberedUser() {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
      this.rememberMe = true;
    }
  }

  // =============== UTILIDADES ===============
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  clearError() {
    if (this.error) {
      this.error = null;
      this.cdr.markForCheck();
    }
  }
}