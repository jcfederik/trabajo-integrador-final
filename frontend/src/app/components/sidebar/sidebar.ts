import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface SidebarItem {
  title: string;
  icon?: string;  
  route?: string;
  disabled?: boolean;
  isHeader?: boolean;
  badge?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent {
  isCollapsed = false; // Cambiado a false para que aparezca expandida por defecto
  currentRoute: string = '';

  @Output() sidebarStateChange = new EventEmitter<boolean>();

  menuItems: SidebarItem[] = [
    { title: 'MENÚ PRINCIPAL', isHeader: true },
    { title: 'Dashboard', icon: 'bi-speedometer2', route: '/dashboard' },
    { title: 'Clientes', icon: 'bi-people', route: '/clientes' },
    { title: 'Equipos', icon: 'bi-laptop', route: '/equipos' },
    { title: 'Reparaciones', icon: 'bi-wrench', route: '/reparaciones', badge: 'Nuevo' },
    
    { title: 'FACTURACIÓN', isHeader: true },
    { title: 'Facturas', icon: 'bi-receipt', route: '/facturas' },
    { title: 'Presupuestos', icon: 'bi-clipboard-data', route: '/presupuestos' },
    { title: 'Cobros', icon: 'bi-cash-coin', route: '/medios-cobro' },
    
    { title: 'INVENTARIO', isHeader: true },
    { title: 'Repuestos', icon: 'bi-tools', route: '/repuestos' },
    { title: 'Proveedores', icon: 'bi-truck', route: '/proveedores' },
    
    { title: 'ADMINISTRACIÓN', isHeader: true },
    { title: 'Usuarios', icon: 'bi-person-badge', route: '/usuarios', disabled: true },
    { title: 'Especializaciones', icon: 'bi-mortarboard', route: '/especializaciones', disabled: true },
  ];

  constructor(private router: Router) {
    // Escuchar cambios de ruta
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.url;
      });
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    this.sidebarStateChange.emit(this.isCollapsed);
  }

  isActive(route: string | undefined): boolean {
    if (!route) return false;
    return this.currentRoute.includes(route);
  }
}