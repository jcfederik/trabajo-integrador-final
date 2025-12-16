import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { SearchService } from '../../services/busquedaglobal';
import { AuthService } from '../../services/auth';
import { Subscription, filter } from 'rxjs';
import { LogoutModalComponent } from '../logout-modal/logout-modal.component';

// COMPONENTE NAVBAR
@Component({
  selector: 'nav-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LogoutModalComponent],
  templateUrl: './nav-bar.html',
  styleUrls: ['./nav-bar.css']
})
export class NavBar implements OnInit, OnDestroy {
  // PROPIEDADES DEL COMPONENTE
  searchTerm: string = '';
  placeholder: string = 'Buscar...';
  usuarioActual: string = 'Usuario';
  userTipo: string = 'Usuario';
  isDashboard: boolean = false;
  mostrarModalLogout: boolean = false;
  searchDisabled: boolean = false;

  // PROPIEDADES PRIVADAS
  private backspacePresionado = false;
  private searchSubscription!: Subscription;
  private componentSubscription!: Subscription;
  private routerSubscription!: Subscription;

  private readonly componentesBloqueados: string[] = [
    'historial_stock',
    'usuarios',
    'especializaciones'
  ];

  // CONSTRUCTOR
  constructor(
    public searchService: SearchService, 
    public router: Router,
    private authService: AuthService
  ) {}

  // LIFECYCLE HOOKS
  ngOnInit() {
    this.checkCurrentRoute();
    this.setPlaceholderByRoute();
    this.loadUserData();
    this.configurarSuscripciones();
  }

  ngOnDestroy() {
    if (this.searchSubscription) this.searchSubscription.unsubscribe();
    if (this.componentSubscription) this.componentSubscription.unsubscribe();
    if (this.routerSubscription) this.routerSubscription.unsubscribe();
  }

  // CONFIGURACIÓN DE SUSCRIPCIONES
  private configurarSuscripciones() {
    this.searchSubscription = this.searchService.globalSearchTerm$.subscribe(term => {
      if (term !== this.searchTerm) {
        this.searchTerm = term;
      }
    });

    this.componentSubscription = this.searchService.currentComponent$.subscribe(component => {
      setTimeout(() => {
        this.placeholder = this.getPlaceholder(component);
        
        this.searchDisabled = this.componentesBloqueados.includes(component);
      });
    });

    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        setTimeout(() => {
          this.checkCurrentRoute();
          this.setPlaceholderByRoute();
        });
      });
  }

  // GESTIÓN DE MODAL DE PERFIL
  abrirModalPerfil() {
    this.mostrarModalLogout = true;
  }

  cerrarModalPerfil() {
    this.mostrarModalLogout = false;
    this.loadUserData();
  }

  // AUTENTICACIÓN Y USUARIO
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  getEspecializacionesCount(): number {
    const user = this.authService.getCurrentUser();
    return user?.especializaciones?.length || 0;
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
 
  // GESTIÓN DE RUTAS
  private checkCurrentRoute() {
    this.isDashboard = this.esDashboard();
  }

  private setPlaceholderByRoute() {
    const currentPath = window.location.pathname;
    const map: any = {
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
      'detalles-cobro': 'Buscar detalles de cobro...'
    };

    for (let key in map) {
      if (currentPath.includes(key)) {
        this.placeholder = map[key];
        
        this.searchDisabled = currentPath.includes('usuarios') || 
                              currentPath.includes('especializaciones') || 
                              currentPath.includes('historial-stock');
        return;
      }
    }

    this.searchDisabled = currentPath.includes('usuarios') || 
                          currentPath.includes('especializaciones') || 
                          currentPath.includes('historial-stock');
    
    this.placeholder = this.isDashboard ? 'Buscar módulos...' : 'Buscar...';
  }

  esDashboard(): boolean {
    return this.router.url.startsWith('/dashboard');
  }

  // CARGA DE DATOS DE USUARIO
  private loadUserData() {
    const user = this.authService.getCurrentUser();

    if (user) {
      this.usuarioActual = user.nombre || user.name || 'Usuario';
      this.userTipo = user.tipo || 'Usuario';
      return;
    }

    const usuarioGuardado = localStorage.getItem('usuario') || localStorage.getItem('user');
    if (usuarioGuardado) {
      try {
        const parsed = JSON.parse(usuarioGuardado);
        this.usuarioActual = parsed.nombre || parsed.name || 'Usuario';
      } catch {
        this.usuarioActual = 'Usuario';
      }
    }
  }

  // GESTIÓN DE BÚSQUEDA
  onSearch() {
    if (this.searchDisabled) {
      return;
    }

    this.searchService.setGlobalSearchTerm(this.searchTerm);

    if (this.isDashboard) {
      this.searchService.setDashboardSearchTerm(this.searchTerm);
    } else {
      this.searchService.setSearchTerm(this.searchTerm);
    }
  }

  clearSearch() {
    if (this.searchDisabled) {
      return;
    }

    this.searchTerm = '';
    this.searchService.clearGlobalSearch();
    this.searchService.clearSearch();
    this.searchService.clearDashboardSearch();
    this.router.navigate([this.router.url]);
  }

  // PLACEHOLDER DINÁMICO
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
      'detalles-cobro': 'Buscar detalles de cobro...',
      'dashboard': 'Buscar módulos...',
      'historial_stock': 'Búsqueda deshabilitada - Use filtros internos',
      'usuarios': 'Búsqueda deshabilitada - Gestione usuarios directamente',
      'especializaciones': 'Búsqueda deshabilitada - Gestione especializaciones directamente'
    };
  
    return placeholders[component] || 'Buscar...';
  }

  // CONTROL DE TECLADO
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