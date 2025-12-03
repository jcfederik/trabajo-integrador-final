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

  ngOnDestroy() {
    if (this.searchSubscription) this.searchSubscription.unsubscribe();
    if (this.componentSubscription) this.componentSubscription.unsubscribe();
    if (this.routerSubscription) this.routerSubscription.unsubscribe();

    document.removeEventListener('click', this.cerrarDropdownAlHacerClick.bind(this));
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

    document.addEventListener('click', this.cerrarDropdownAlHacerClick.bind(this));
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

  // 🔥 MODAL LOGOUT
  abrirModalLogout() {
    console.log('👤 Abriendo modal de perfil...');
    this.mostrarModalLogout = true;
    this.showDropdown = false;
  }

  cerrarModalLogout() {
    this.mostrarModalLogout = false;
    this.loadUserData();
  }

  // 🔥 NUEVO: Para verificar si está autenticado
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  // 🔥 NUEVO: Obtener número de especializaciones
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

  // =============== GESTIÓN DE RUTAS ===============
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
        return;
      }
    }

    this.placeholder = this.isDashboard ? 'Buscar módulos...' : 'Buscar...';
  }

  esDashboard(): boolean {
    return this.router.url === '/dashboard' || this.router.url === '/';
  }

  // =============== GESTIÓN DE USUARIO ===============
  private loadUserData() {
    const user = this.authService.getCurrentUser();

    if (user) {
      this.usuarioActual = user.nombre || user.name || 'Usuario';
      this.userTipo = user.tipo || 'Usuario';
      console.log('👤 Usuario cargado:', this.usuarioActual, 'Tipo:', this.userTipo);
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
    this.router.navigate([this.router.url]); // fuerza refresco visual
  }

  // =============== PLACEHOLDER DINÁMICO ===============
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

  // =============== CONTROL BACKSPACE ===============
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
