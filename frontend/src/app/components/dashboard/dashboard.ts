import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent implements OnInit {
  currentUser = signal<any>(null);

  cards: DashboardCard[] = [
    { 
      title: 'Clientes', 
      icon: 'bi-people', 
      description: 'Gestión de clientes', 
      route: '/clientes',
      permissions: ['clients.manage', 'clients.view']
    },
    { 
      title: 'Equipos', 
      icon: 'bi-laptop', 
      description: 'Registro de equipos', 
      route: '/equipos',
      permissions: ['equipos.manage', 'equipos.view', 'equipos.create']
    },
    { 
      title: 'Facturas', 
      icon: 'bi-receipt', 
      description: 'Facturación y pagos', 
      route: '/facturas',
      permissions: ['facturas.manage', 'facturas.view', 'facturas.create', 'facturas.edit']
    },
    { 
      title: 'Proveedores', 
      icon: 'bi-truck', 
      description: 'Gestión de proveedores', 
      route: '/proveedores',
      permissions: ['proveedores.manage']
    },
    { 
      title: 'Repuestos', 
      icon: 'bi-tools', 
      description: 'Inventario de repuestos', 
      route: '/repuestos',
      permissions: ['repuestos.manage', 'repuestos.view']
    },
    { 
      title: 'Presupuestos', 
      icon: 'bi-clipboard-data', 
      description: 'Creación de presupuestos', 
      route: '/presupuestos',
      permissions: ['presupuestos.manage', 'presupuestos.view', 'presupuestos.create']
    },
    { 
      title: 'Reparaciones', 
      icon: 'bi-wrench', 
      description: 'Seguimiento de reparaciones', 
      route: '/reparaciones',
      permissions: ['reparaciones.manage', 'reparaciones.view', 'reparaciones.create', 'reparaciones.update']
    },
    { 
      title: 'Usuarios', 
      icon: 'bi-person-badge', 
      description: 'Administración de usuarios', 
      route: '/usuarios',
      permissions: ['users.manage']
    },
    { 
      title: 'Especializaciones', 
      icon: 'bi-mortarboard', 
      description: 'Gestión de especializaciones', 
      route: '/especializaciones',
      permissions: ['especializaciones.manage', 'especializaciones.view']
    },
  ];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.currentUser.set(this.authService.getCurrentUser());
    this.applyPermissions();
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

    this.cards = updatedCards;
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
  permissions?: string[];
}