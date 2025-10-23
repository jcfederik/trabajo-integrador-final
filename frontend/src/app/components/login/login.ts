import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  loading = false;
  error: string | null = null;

  constructor(private auth: AuthService, private router: Router, private cdr: ChangeDetectorRef) {}

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

    const { nombre, password } = form.value; // 👈 tu backend usa "nombre"

    this.auth.login(nombre, password).subscribe({
      next: (res) => {
        // guardar token devuelto por Laravel JWTAuth
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));

        this.loading = false;
        this.cdr.markForCheck();
        // this.router.navigate(['/home']);
        console.log('Login successful:', res);
        
      },
      error: (error) => {
        this.loading = false;

        if (error.status === 401) {
          this.error = 'Credenciales inválidas. Verificá tu usuario o contraseña.';
        } else if (error.status === 0) {
          this.error = 'Error de conexión con el servidor.';
        } else if (error.status >= 500) {
          this.error = 'Error interno del servidor.';
        } else {
          this.error = 'Error inesperado. Inténtalo de nuevo.';
        }

        this.cdr.markForCheck();
        console.error('Login error:', error);
      },
    });
  }

  clearError() {
    this.error = null;
    this.cdr.markForCheck();
  }
}
