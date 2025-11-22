import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SearchService, DashboardComponent as DashboardComponentInterface } from '../../services/busquedaglobal';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  searchTerm: string = '';
  filteredCards = signal<DashboardCard[]>([]);
  private searchSubscription!: Subscription;
  currentUser = signal<any>(null);

  cards: DashboardCard[] = [
    { 
      title: 'Clientes', 
      icon: 'bi-people', 
      description: 'Gestión de clientes', 
      route: '/clientes',
      type: 'clientes',
      permissions: ['clients.manage', 'clients.view']
    },
    { 
      title: 'Equipos', 
      icon: 'bi-laptop', 
      description: 'Registro de equipos', 
      route: '/equipos',
      type: 'equipos',
      permissions: ['equipos.manage', 'equipos.view', 'equipos.create']
    },
    { 
      title: 'Facturas', 
      icon: 'bi-receipt', 
      description: 'Facturación y pagos', 
      route: '/facturas',
      type: 'facturas',
      permissions: ['facturas.manage', 'facturas.view', 'facturas.create', 'facturas.edit']
    },
    { 
      title: 'Proveedores', 
      icon: 'bi-truck', 
      description: 'Gestión de proveedores', 
      route: '/proveedores',
      type: 'proveedores',
      permissions: ['proveedores.manage']
    },
    { 
      title: 'Repuestos', 
      icon: 'bi-tools', 
      description: 'Inventario de repuestos', 
      route: '/repuestos',
      type: 'repuestos',
      permissions: ['repuestos.manage', 'repuestos.view']
    },
    { 
      title: 'Presupuestos', 
      icon: 'bi-clipboard-data', 
      description: 'Creación de presupuestos', 
      route: '/presupuestos',
      type: 'presupuestos',
      permissions: ['presupuestos.manage', 'presupuestos.view', 'presupuestos.create']
    },
    { 
      title: 'Reparaciones', 
      icon: 'bi-wrench', 
      description: 'Seguimiento de reparaciones', 
      route: '/reparaciones',
      type: 'reparaciones',
      permissions: ['reparaciones.manage', 'reparaciones.view', 'reparaciones.create', 'reparaciones.update']
    },
    { 
      title: 'Cobros', 
      icon: 'bi-cash-coin', 
      description: 'Medios de cobro', 
      route: '/medios-cobro',
      type: 'cobros',
      permissions: ['cobros.manage', 'cobros.view', 'cobros.create']
    },
    { 
      title: 'Usuarios', 
      icon: 'bi-person-badge', 
      description: 'Administración de usuarios', 
      route: '/usuarios',
      type: 'usuarios',
      permissions: ['users.manage']
    },
    { 
      title: 'Especializaciones', 
      icon: 'bi-mortarboard', 
      description: 'Gestión de especializaciones', 
      route: '/especializaciones', 
      type: 'especializaciones',
      permissions: ['especializaciones.manage', 'especializaciones.view']
    },
    { 
      title: 'Detalles de Cobro', 
      icon: 'bi-journal-check', 
      description: 'Historial de cobros', 
      route: '/detalle-cobro', 
      type: 'detalle-cobro',
      permissions: ['cobros.view']
    },
  ];

  constructor(
    private searchService: SearchService,
    private authService: AuthService
  ) {
    this.filteredCards.set(this.cards);
  }

  ngOnInit() {
    this.searchService.setCurrentComponent('dashboard');
    
    this.currentUser.set(this.authService.getCurrentUser());
    this.applyPermissions();

    this.searchSubscription = this.searchService.globalSearchTerm$.subscribe(term => {
      if (term !== this.searchTerm) {
        this.searchTerm = term;
        this.performSearch();
      }
    });

    this.searchService.dashboardSearchTerm$.subscribe(term => {
      if (term !== this.searchTerm) {
        this.searchTerm = term;
        this.performSearch();
      }
    });
  }

  private applyPermissions() {
    const updatedCards = this.cards.map(card => {
      const hasAccess = card.permissions 
        ? this.authService.hasAnyPermission(card.permissions)
        : true;

      return {
        ...card,
        disabled: !hasAccess
      };
    });

    this.filteredCards.set(updatedCards);
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  onSearchChange() {
    this.searchService.setGlobalSearchTerm(this.searchTerm);
    this.searchService.setDashboardSearchTerm(this.searchTerm);
    this.performSearch();
  }

  clearSearch() {
    this.searchTerm = '';
    this.searchService.clearGlobalSearch();
    this.searchService.clearDashboardSearch();
    this.filteredCards.set(this.cards);
  }

  private performSearch() {
    if (this.searchTerm.trim()) {
      const filtered = this.searchService.searchDashboardComponents(
        this.cards as DashboardComponentInterface[], 
        this.searchTerm
      );
      this.filteredCards.set(filtered);
    } else {
      this.filteredCards.set(this.cards);
    }
  }

  getSearchResultsCount(): number {
    return this.filteredCards().length;
  }

  isUserAdmin(): boolean {
    return this.authService.isAdmin();
  }
}

interface DashboardCard {
  title: string;
  icon: string;
  description: string;
  route?: string;
  disabled?: boolean;
  type: string;
  permissions?: string[];
}