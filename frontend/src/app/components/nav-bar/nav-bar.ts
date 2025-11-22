import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { SearchService } from '../../services/busquedaglobal';
import { AuthService } from '../../services/auth';
import { Subscription, filter } from 'rxjs';
import { LogoutModalComponent } from '../logout-modal/logout-modal.component';

@Component({
  selector: 'nav-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LogoutModalComponent],
  templateUrl: './nav-bar.html',
  styleUrls: ['./nav-bar.css']
})
export class NavBar implements OnInit, OnDestroy {

  // =============== ESTADOS DEL COMPONENTE ===============
  searchTerm: string = '';
  placeholder: string = 'Buscar...';
  usuarioActual: string = 'Usuario';
  userTipo: string = 'Usuario';
  isDashboard: boolean = false;
  showDropdown: boolean = false;
  mostrarModalLogout: boolean = false;

  // =============== CONTROL DE TECLADO ===============
  private backspacePresionado = false;  

  // =============== SUSCRIPCIONES ===============
  private searchSubscription!: Subscription;
  private componentSubscription!: Subscription;
  private routerSubscription!: Subscription;

  constructor(
    public searchService: SearchService, 
    public router: Router,
    private authService: AuthService
  ) {}

  // =============== LIFECYCLE ===============
  ngOnInit() {
    console.log('🔐 NavBar iniciado - Usuario:', this.authService.getCurrentUser());
    
    this.checkCurrentRoute();
    this.setPlaceholderByRoute();
    this.loadUserData();
    this.configurarSuscripciones();
  }

  // =============== CONFIGURACIÓN ===============
  private configurarSuscripciones() {
    this.searchSubscription = this.searchService.globalSearchTerm$.subscribe(term => {
      if (term !== this.searchTerm) {
        this.searchTerm = term;
      }
    });

    this.componentSubscription = this.searchService.currentComponent$.subscribe(component => {
      setTimeout(() => {
        this.placeholder = this.getPlaceholder(component);
      });
    });

    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        setTimeout(() => {
          this.checkCurrentRoute();
          this.setPlaceholderByRoute();
          this.showDropdown = false;
        });
      });

    // Cerrar dropdown al hacer click fuera
    document.addEventListener('click', this.cerrarDropdownAlHacerClick.bind(this));
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
    if (this.componentSubscription) {
      this.componentSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    document.removeEventListener('click', this.cerrarDropdownAlHacerClick.bind(this));
  }

  private cerrarDropdownAlHacerClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-dropdown')) {
      this.showDropdown = false;
    }
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  // 🔥 MODIFICADO: Ahora abre el modal de perfil
  abrirModalLogout() {
    console.log('👤 Abriendo modal de perfil...');
    this.mostrarModalLogout = true;
    this.showDropdown = false;
  }

  cerrarModalLogout() {
    this.mostrarModalLogout = false;
    // Actualizar datos del usuario después de cerrar el modal
    this.loadUserData();
  }

  // ❌ ELIMINADO: Método logout() - Ahora está en el modal de perfil

  // 🔥 NUEVO: Obtener número de especializaciones
  getEspecializacionesCount(): number {
    const user = this.authService.getCurrentUser();
    const count = user?.especializaciones?.length || 0;
    console.log('🔢 Contador de especializaciones:', count);
    return count;
  }

  getUserTipo(): string {
    const user = this.authService.getCurrentUser();
    const tipo = user?.tipo || 'usuario';
    
    const tipoMap: { [key: string]: string } = {
      'administrador': 'Admin',
      'tecnico': 'Técnico', 
      'usuario': 'Usuario'
    };
    
    return tipoMap[tipo] || tipo;
  }

  // ✅ AGREGADO: Método público para verificar autenticación
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  private checkCurrentRoute() {
    this.isDashboard = this.esDashboard();
  }

  private setPlaceholderByRoute() {
    const currentPath = window.location.pathname;
    if (currentPath.includes('equipos')) {
      this.placeholder = 'Buscar equipos...';
    } else if (currentPath.includes('clientes')) {
      this.placeholder = 'Buscar clientes...';
    } else if (currentPath.includes('facturas')) {
      this.placeholder = 'Buscar facturas...';
    } else if (currentPath.includes('proveedores')) {
      this.placeholder = 'Buscar proveedores...';
    } else if (currentPath.includes('repuestos')) {
      this.placeholder = 'Buscar repuestos...';
    } else if (currentPath.includes('presupuestos')) {
      this.placeholder = 'Buscar presupuestos...';
    } else if (currentPath.includes('reparaciones')) {
      this.placeholder = 'Buscar reparaciones...';
    } else if (currentPath.includes('cobros')) {
      this.placeholder = 'Buscar cobros...';
    } else if (currentPath.includes('usuarios')) {
      this.placeholder = 'Buscar usuarios...';
    } else if (currentPath.includes('especializaciones')) {
      this.placeholder = 'Buscar especializaciones...';
    } else if (currentPath.includes('detalles-cobro')) {
      this.placeholder = 'Buscar detalles de cobro...';
    } else if (this.isDashboard) {
      this.placeholder = 'Buscar módulos...';
    } else {
      this.placeholder = 'Buscar...';
    }
  }

  esDashboard(): boolean {
    return this.router.url === '/dashboard' || this.router.url === '/';
  }

  // =============== GESTIÓN DE USUARIO ===============
  private loadUserData() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.usuarioActual = user.nombre || 'Usuario';
      this.userTipo = user.tipo || 'Usuario';
      console.log('👤 Usuario cargado:', this.usuarioActual, 'Tipo:', this.userTipo);
      console.log('🎯 Especializaciones:', user.especializaciones);
    } else {
      console.warn('⚠️ No se encontró usuario autenticado');
      this.usuarioActual = 'Usuario';
      this.userTipo = 'Usuario';
    }
  }


  // =============== BÚSQUEDA ===============
  onSearch() {
    this.searchService.setGlobalSearchTerm(this.searchTerm);
    
    if (this.isDashboard) {
      this.searchService.setDashboardSearchTerm(this.searchTerm);
    } else {
      this.searchService.setSearchTerm(this.searchTerm);
    }
  }

  clearSearch() {
    this.searchTerm = '';
    this.searchService.clearGlobalSearch();
    this.searchService.clearSearch();
    this.searchService.clearDashboardSearch();
  }

  // =============== UTILIDADES ===============
  private getPlaceholder(component: string): string {
    const placeholders: { [key: string]: string } = {
      'equipos': 'Buscar equipos...',
      'clientes': 'Buscar clientes...',
      'facturas': 'Buscar facturas...',
      'proveedores': 'Buscar proveedores...',
      'repuestos': 'Buscar repuestos...',
      'presupuestos': 'Buscar presupuestos...',
      'reparaciones': 'Buscar reparaciones...',
      'cobros': 'Buscar cobros...',
      'usuarios': 'Buscar usuarios...',
      'especializaciones': 'Buscar especializaciones...',
      'detalles-cobro': 'Buscar detalles de cobro...',
      'dashboard': 'Buscar módulos...'
    };
    
    return placeholders[component] || 'Buscar...';
  }

  // =============== CONTROL DE TECLADO ===============
  bloquearBackspaceHold(event: KeyboardEvent) {
    if (event.key !== 'Backspace') return;

    if (this.backspacePresionado) {
      event.preventDefault();
      return;
    }

    this.backspacePresionado = true;
  }

  @HostListener('document:keyup', ['$event'])
  resetBackspace(event: KeyboardEvent) {
    if (event.key === 'Backspace') {
      this.backspacePresionado = false; 
    }
  }
}