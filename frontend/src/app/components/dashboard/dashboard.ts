// src/app/components/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs'; // 🔥 NUEVO: Importar Subscription
import { SearchService, DashboardComponent as DashboardComponentInterface } from '../../services/busquedaglobal';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent implements OnInit, OnDestroy { // 🔥 MODIFICADO: Implementar OnInit y OnDestroy
  searchTerm: string = '';
  filteredCards: DashboardCard[] = [];
  private searchSubscription!: Subscription; // 🔥 NUEVO: Suscripción para búsqueda global

  // 🔹 Placeholder inicial: representando los controladores
  cards: DashboardCard[] = [
    { 
      title: 'Clientes', 
      icon: 'bi-people', 
      description: 'Gestión de clientes', 
      route: '/clientes',
      type: 'clientes'
    },
    { 
      title: 'Equipos', 
      icon: 'bi-laptop', 
      description: 'Registro de equipos', 
      route: '/equipos',
      type: 'equipos'
    },
    { 
      title: 'Facturas', 
      icon: 'bi-receipt', 
      description: 'Facturación y pagos', 
      route: '/facturas',
      type: 'facturas',
      disabled: true
    },
    { 
      title: 'Proveedores', 
      icon: 'bi-truck', 
      description: 'Gestión de proveedores', 
      route: '/proveedores',
      type: 'proveedores',
      disabled: true
    },
    { 
      title: 'Repuestos', 
      icon: 'bi-tools', 
      description: 'Inventario de repuestos', 
      route: '/repuestos',
      type: 'repuestos',
      disabled: true
    },
    { 
      title: 'Presupuestos', 
      icon: 'bi-clipboard-data', 
      description: 'Creación de presupuestos', 
      route: '/presupuestos',
      type: 'presupuestos',
      disabled: true
    },
    { 
      title: 'Reparaciones', 
      icon: 'bi-wrench', 
      description: 'Seguimiento de reparaciones', 
      route: '/reparaciones',
      type: 'reparaciones'
    
    },
    { 
      title: 'Cobros', 
      icon: 'bi-cash-coin', 
      description: 'Medios de cobro', 
      route: '/medios-cobro',
      type: 'cobros',
      disabled: true
    },
    { 
      title: 'Usuarios', 
      icon: 'bi-person-badge', 
      description: 'Administración de usuarios', 
      route: '/usuarios',
      type: 'usuarios',
      disabled: true
    },
    { 
      title: 'Especializaciones', 
      icon: 'bi-mortarboard', 
      description: 'Gestión de especializaciones', 
      route: '/especializaciones', 
      disabled: true,
      type: 'especializaciones'
    },
    { 
      title: 'Detalles de Cobro', 
      icon: 'bi-journal-check', 
      description: 'Historial de cobros', 
      route: '/detalle-cobro', 
      disabled: true,
      type: 'detalle-cobro'
    },
  ];

  constructor(private searchService: SearchService) {
    this.filteredCards = this.cards;
  }

  ngOnInit() {
    // 🔥 NUEVO: Suscribirse a cambios en la búsqueda global
    this.searchSubscription = this.searchService.globalSearchTerm$.subscribe(term => {
      if (term !== this.searchTerm) {
        this.searchTerm = term;
        this.performSearch();
      }
    });

    // 🔥 NUEVO: También suscribirse a cambios específicos del dashboard
    this.searchService.dashboardSearchTerm$.subscribe(term => {
      if (term !== this.searchTerm) {
        this.searchTerm = term;
        this.performSearch();
      }
    });
  }

  ngOnDestroy() {
    // 🔥 NUEVO: Limpiar suscripción al destruir el componente
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  onSearchChange() {
    // 🔥 MODIFICADO: Usar búsqueda global
    this.searchService.setGlobalSearchTerm(this.searchTerm);
    this.searchService.setDashboardSearchTerm(this.searchTerm);
    this.performSearch();
  }

  clearSearch() {
    this.searchTerm = '';
    // 🔥 MODIFICADO: Limpiar búsqueda global
    this.searchService.clearGlobalSearch();
    this.searchService.clearDashboardSearch();
    this.filteredCards = this.cards;
  }

  // 🔥 NUEVO: Método centralizado para realizar búsqueda
  private performSearch() {
    if (this.searchTerm.trim()) {
      this.filteredCards = this.searchService.searchDashboardComponents(
        this.cards as DashboardComponentInterface[], 
        this.searchTerm
      );
    } else {
      this.filteredCards = this.cards;
    }
  }

  getSearchResultsCount(): number {
    return this.filteredCards.length;
  }

  getTotalCardsCount(): number {
    return this.cards.length;
  }
}

interface DashboardCard {
  title: string;
  icon: string;
  description: string;
  route?: string;
  disabled?: boolean;
  type: string;
}