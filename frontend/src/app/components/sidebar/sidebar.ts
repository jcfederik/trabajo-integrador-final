import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth';

interface SidebarItem {
  title: string;
  icon?: string;  
  route?: string;
  disabled?: boolean;
  isHeader?: boolean;
  badge?: string;
  requiredPermission?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent implements OnInit {
  isCollapsed = false;
  currentRoute: string = '';
  userPermissions: string[] = [];

  @Output() sidebarStateChange = new EventEmitter<boolean>();

  menuItems: SidebarItem[] = [
    { title: 'MENÚ PRINCIPAL', isHeader: true },
    { title: 'Dashboard', icon: 'bi-speedometer2', route: '/dashboard', requiredPermission: 'dashboard.view' },
    { title: 'Clientes', icon: 'bi-people', route: '/clientes', requiredPermission: 'clients.view' },
    { title: 'Equipos', icon: 'bi-laptop', route: '/equipos', requiredPermission: 'equipos.view' },
    { title: 'Reparaciones', icon: 'bi-wrench', route: '/reparaciones', requiredPermission: 'reparaciones.view' },
    
    { title: 'FACTURACIÓN', isHeader: true },
    { title: 'Facturas', icon: 'bi-receipt', route: '/facturas', requiredPermission: 'facturas.view' },
    { title: 'Presupuestos', icon: 'bi-clipboard-data', route: '/presupuestos', requiredPermission: 'presupuestos.view' },
    { title: 'Cobros', icon: 'bi-cash-coin', route: '/medios-cobro', requiredPermission: 'cobros.view' },
    
    { title: 'INVENTARIO', isHeader: true },
    { title: 'Repuestos', icon: 'bi-tools', route: '/repuestos', requiredPermission: 'repuestos.view' },
    { title: 'Proveedores', icon: 'bi-truck', route: '/proveedores', requiredPermission: 'proveedores.manage' },
    
    { title: 'ADMINISTRACIÓN', isHeader: true },
    { title: 'Usuarios', icon: 'bi-person-badge', route: '/usuarios', requiredPermission: 'users.manage' },
    { title: 'Especializaciones', icon: 'bi-mortarboard', route: '/especializaciones', requiredPermission: 'especializaciones.manage' },
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.url;
      });
  }

  ngOnInit() {
    this.userPermissions = this.authService.getUserPermissions();
    console.log('🔐 Permisos del usuario:', this.userPermissions);
    console.log('👤 Es administrador:', this.authService.isAdmin());
  }

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  get filteredMenuItems(): SidebarItem[] {
    const filteredItems: SidebarItem[] = [];
    let lastHeader: SidebarItem | null = null;

    for (const item of this.menuItems) {
      if (item.isHeader) {
        lastHeader = item;
        continue;
      }

      if (!item.requiredPermission || this.hasPermission(item.requiredPermission)) {
        if (lastHeader) {
          filteredItems.push(lastHeader);
          lastHeader = null;
        }
        filteredItems.push(item);
      }
    }

    return filteredItems;
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