import { Component, Output, EventEmitter, OnInit } from '@angular/core'; // ← Agregá OnInit
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth'; // ← Agregá este import

interface SidebarItem {
  title: string;
  icon?: string;  
  route?: string;
  disabled?: boolean;
  isHeader?: boolean;
  badge?: string;
  requiredPermission?: string; // ← AGREGÁ ESTA LÍNEA
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent implements OnInit { // ← Agregá implements OnInit
  isCollapsed = false;
  currentRoute: string = '';
  userPermissions: string[] = []; // ← AGREGÁ ESTA LÍNEA

  @Output() sidebarStateChange = new EventEmitter<boolean>();

  menuItems: SidebarItem[] = [
    { title: 'MENÚ PRINCIPAL', isHeader: true },
    { title: 'Dashboard', icon: 'bi-speedometer2', route: '/dashboard', requiredPermission: 'dashboard.view' }, // ← AGREGÁ requiredPermission
    { title: 'Clientes', icon: 'bi-people', route: '/clientes', requiredPermission: 'clients.view' }, // ← AGREGÁ requiredPermission
    { title: 'Equipos', icon: 'bi-laptop', route: '/equipos', requiredPermission: 'equipos.view' }, // ← AGREGÁ requiredPermission
    { title: 'Reparaciones', icon: 'bi-wrench', route: '/reparaciones', badge: 'Nuevo', requiredPermission: 'reparaciones.view' }, // ← AGREGÁ requiredPermission
    
    { title: 'FACTURACIÓN', isHeader: true },
    { title: 'Facturas', icon: 'bi-receipt', route: '/facturas', requiredPermission: 'facturas.view' }, // ← AGREGÁ requiredPermission
    { title: 'Presupuestos', icon: 'bi-clipboard-data', route: '/presupuestos', requiredPermission: 'presupuestos.view' }, // ← AGREGÁ requiredPermission
    { title: 'Cobros', icon: 'bi-cash-coin', route: '/medios-cobro', requiredPermission: 'cobros.view' }, // ← AGREGÁ requiredPermission
    
    { title: 'INVENTARIO', isHeader: true },
    { title: 'Repuestos', icon: 'bi-tools', route: '/repuestos', requiredPermission: 'repuestos.view' }, // ← AGREGÁ requiredPermission
    { title: 'Proveedores', icon: 'bi-truck', route: '/proveedores', requiredPermission: 'proveedores.manage' }, // ← AGREGÁ requiredPermission
    
    { title: 'ADMINISTRACIÓN', isHeader: true },
    { title: 'Usuarios', icon: 'bi-person-badge', route: '/usuarios', requiredPermission: 'users.manage' }, // ← QUITÁ disabled: true y agregá requiredPermission
    { title: 'Especializaciones', icon: 'bi-mortarboard', route: '/especializaciones', requiredPermission: 'especializaciones.manage' }, // ← QUITÁ disabled: true y agregá requiredPermission
  ];

  constructor(
    private router: Router,
    private authService: AuthService // ← AGREGÁ esto al constructor
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.url;
      });
  }

  // ← AGREGÁ ESTOS TRES MÉTODOS NUEVOS:
  ngOnInit() {
    this.userPermissions = this.authService.getUserPermissions();
  }

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

get filteredMenuItems() {
  return this.menuItems.filter(item => {
    // Mostrar headers siempre
    if (item.isHeader) {
      return true;
    }
    
    // Si no requiere permiso, mostrar siempre
    if (!item.requiredPermission) {
      return true;
    }
    
    // Solo mostrar si tiene el permiso requerido
    return this.hasPermission(item.requiredPermission);
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