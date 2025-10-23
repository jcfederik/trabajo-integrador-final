import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface DashboardCard {
  title: string;
  icon: string;
  description: string;
  route?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent {
  // 🔹 Placeholder inicial: representando los controladores
  cards: DashboardCard[] = [
    { title: 'Clientes', icon: 'bi-people', description: 'Gestión de clientes', route: '/clientes' },
    { title: 'Equipos', icon: 'bi-laptop', description: 'Registro de equipos', route: '/equipos' },
    { title: 'Facturas', icon: 'bi-receipt', description: 'Facturación y pagos', route: '/facturas' },
    { title: 'Proveedores', icon: 'bi-truck', description: 'Gestión de proveedores', route: '/proveedores' },
    { title: 'Repuestos', icon: 'bi-tools', description: 'Inventario de repuestos', route: '/repuestos' },
    { title: 'Presupuestos', icon: 'bi-clipboard-data', description: 'Creación de presupuestos', route: '/presupuestos' },
    { title: 'Reparaciones', icon: 'bi-wrench', description: 'Seguimiento de reparaciones', route: '/reparaciones' },
    { title: 'Cobros', icon: 'bi-cash-coin', description: 'Medios de cobro', route: '/medios-cobro' },
    { title: 'Usuarios', icon: 'bi-person-badge', description: 'Administración de usuarios', route: '/usuarios' },
    { title: 'Especializaciones', icon: 'bi-mortarboard', description: 'Gestión de especializaciones', route: '/especializaciones', disabled: true },
    { title: 'Detalles de Cobro', icon: 'bi-journal-check', description: 'Historial de cobros', route: '/detalle-cobro', disabled: true },
  ];
}
