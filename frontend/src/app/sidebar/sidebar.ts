import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface SidebarItem {
  title: string;
  icon?: string;  
  route?: string;
  disabled?: boolean;
  isHeader?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent {
  isCollapsed = false;

  menuItems: SidebarItem[] = [
    { title: 'MENÚ PRINCIPAL', isHeader: true },
    { title: 'Dashboard', icon: 'bi-speedometer2', route: '/dashboard' },
    { title: 'Clientes', icon: 'bi-people', route: '/clientes' },
    { title: 'Equipos', icon: 'bi-laptop', route: '/equipos' },
    { title: 'Reparaciones', icon: 'bi-wrench', route: '/reparaciones' },
    
    { title: 'FACTURACIÓN', isHeader: true },
    { title: 'Facturas', icon: 'bi-receipt', route: '/facturas' },
    { title: 'Presupuestos', icon: 'bi-clipboard-data', route: '/presupuestos' },
    { title: 'Cobros', icon: 'bi-cash-coin', route: '/medios-cobro' },
    
    { title: 'INVENTARIO', isHeader: true },
    { title: 'Repuestos', icon: 'bi-tools', route: '/repuestos' },
    { title: 'Proveedores', icon: 'bi-truck', route: '/proveedores' },
    
    { title: 'ADMINISTRACIÓN', isHeader: true },
    { title: 'Usuarios', icon: 'bi-person-badge', route: '/usuarios' },
    { title: 'Especializaciones', icon: 'bi-mortarboard', route: '/especializaciones', disabled: true },
  ];

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }
}