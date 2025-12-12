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

  // Reorganizar el orden: HistorialStock antes de Repuestos
  cards: DashboardCard[] = [
    { 
      title: 'Clientes', 
      icon: 'bi-people-fill', 
      description: 'Gestión de clientes', 
      route: '/clientes',
      permissions: ['clients.manage', 'clients.view'],
      color: 'primary'
    },
    { 
      title: 'Equipos', 
      icon: 'bi-pc-display', 
      description: 'Registro de equipos', 
      route: '/equipos',
      permissions: ['equipos.manage', 'equipos.view', 'equipos.create'],
      color: 'info'
    },
    { 
      title: 'Reparaciones', 
      icon: 'bi-tools', 
      description: 'Seguimiento de reparaciones', 
      route: '/reparaciones',
      permissions: ['reparaciones.manage', 'reparaciones.view', 'reparaciones.create', 'reparaciones.update'],
      color: 'warning'
    },
    { 
      title: 'Presupuestos', 
      icon: 'bi-clipboard-check', 
      description: 'Creación de presupuestos', 
      route: '/presupuestos',
      permissions: ['presupuestos.manage', 'presupuestos.view', 'presupuestos.create'],
      color: 'success'
    },
    { 
      title: 'Historial de Stock', 
      icon: 'bi-clock-history', 
      description: 'Movimientos de inventario', 
      route: '/historial-stock',
      permissions: ['repuestos.manage', 'repuestos.view'],
      color: 'secondary'
    },
    { 
      title: 'Repuestos', 
      icon: 'bi-box-seam', 
      description: 'Inventario de repuestos', 
      route: '/repuestos',
      permissions: ['repuestos.manage', 'repuestos.view'],
      color: 'danger'
    },
    { 
      title: 'Facturas', 
      icon: 'bi-receipt', 
      description: 'Facturación y pagos', 
      route: '/facturas',
      permissions: ['facturas.manage', 'facturas.view', 'facturas.create', 'facturas.edit'],
      color: 'primary'
    },
    { 
      title: 'Proveedores', 
      icon: 'bi-truck', 
      description: 'Gestión de proveedores', 
      route: '/proveedores',
      permissions: ['proveedores.manage'],
      color: 'info'
    },
    { 
      title: 'Usuarios', 
      icon: 'bi-person-badge', 
      description: 'Administración de usuarios', 
      route: '/usuarios',
      permissions: ['users.manage'],
      color: 'warning'
    },
    { 
      title: 'Especializaciones', 
      icon: 'bi-mortarboard', 
      description: 'Gestión de especializaciones', 
      route: '/especializaciones',
      permissions: ['especializaciones.manage', 'especializaciones.view'],
      color: 'success'
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

  // Método para obtener la clase de color del badge
  getBadgeClass(card: DashboardCard): string {
    return card.disabled ? 'bg-warning' : `bg-${card.color}`;
  }

  // Método para obtener la clase del icono
  getIconClass(card: DashboardCard): string {
    return card.disabled ? 'text-muted' : `text-${card.color}`;
  }
}

interface DashboardCard {
  title: string;
  icon: string;
  description: string;
  route?: string;
  disabled?: boolean;
  permissions?: string[];
  color: string;
}