import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SearchService } from '../../services/busquedaglobal';

@Component({
  selector: 'nav-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './nav-bar.html',
  styleUrls: ['./nav-bar.css']
})
export class NavBar implements OnInit {
  username: string = 'Usuario';
  searchQuery: string = '';
  currentComponent: string = '';
  placeholder: string = 'Buscar...';
  searchTerm: string = '';
  usuarioActual: string = 'Usuario';

  constructor(public searchService: SearchService, public router: Router) {}

  ngOnInit() {
    this.setPlaceholderByRoute();

    // 🔥 Nuevo: obtener nombre del usuario guardado
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      try {
        const usuario = JSON.parse(usuarioGuardado);
        this.usuarioActual = usuario.nombre || 'Usuario';
      } catch {
        this.usuarioActual = 'Usuario';
      }
    }

    // 🔥 NUEVO: Sincronizar con búsqueda global cuando cambia
    this.searchService.globalSearchTerm$.subscribe(term => {
      if (term !== this.searchTerm) {
        this.searchTerm = term;
      }
    });

    this.searchService.currentComponent$.subscribe(component => {
      setTimeout(() => {
        this.placeholder = this.getPlaceholder(component);
      });
    });
  }

  private setPlaceholderByRoute() {
    const currentPath = window.location.pathname;
    if (currentPath.includes('equipos')) {
      this.placeholder = 'Buscar equipos...';
    } else if (currentPath.includes('clientes')) {
      this.placeholder = 'Buscar clientes...';
    } else if (currentPath.includes('facturas')) {
      this.placeholder = 'Buscar facturas...';
    } else if (currentPath.includes('proveedores')) {
      this.placeholder = 'Buscar proveedores...';
    } else if (currentPath.includes('repuestos')) {
      this.placeholder = 'Buscar repuestos...';
    } else if (currentPath.includes('presupuestos')) {
      this.placeholder = 'Buscar presupuestos...';
    } else if (currentPath.includes('reparaciones')) {
      this.placeholder = 'Buscar reparaciones...';
    } else if (currentPath.includes('cobros')) {
      this.placeholder = 'Buscar cobros...';
    } else if (currentPath.includes('usuarios')) {
      this.placeholder = 'Buscar usuarios...';
    } else if (currentPath.includes('especializaciones')) {
      this.placeholder = 'Buscar especializaciones...';
    } else if (currentPath.includes('detalles-cobro')) {
      this.placeholder = 'Buscar detalles de cobro...';
    } else if (currentPath === '/dashboard' || currentPath === '/') {
      this.placeholder = 'Buscar módulos... (clientes, equipos, facturas, etc.)'; // 🔥 MODIFICADO
    } else {
      this.placeholder = 'Buscar...';
    }
  }

  private getPlaceholder(component: string): string {
    switch (component) {
      case 'equipos': return 'Buscar equipos...';
      case 'clientes': return 'Buscar clientes...';
      case 'facturas': return 'Buscar facturas...';
      case 'proveedores': return 'Buscar proveedores...';
      case 'repuestos': return 'Buscar repuestos...';
      case 'presupuestos': return 'Buscar presupuestos...';
      case 'reparaciones': return 'Buscar reparaciones...';
      case 'cobros': return 'Buscar cobros...';
      case 'usuarios': return 'Buscar usuarios...';
      case 'especializaciones': return 'Buscar especializaciones...';
      case 'detalles-cobro': return 'Buscar detalles de cobro...';
      case 'dashboard': return 'Buscar módulos... (clientes, equipos, facturas, etc.)'; // 🔥 NUEVO
      default: return 'Buscar...';
    }
  }

  onSearch() {
    // 🔥 MODIFICADO: Usar búsqueda global en lugar de específica
    this.searchService.setGlobalSearchTerm(this.searchTerm);
    
    // Si estamos en dashboard, también actualizar la búsqueda del dashboard
    if (this.esDashboard()) {
      this.searchService.setDashboardSearchTerm(this.searchTerm);
    } else {
      // Para otras páginas, usar la búsqueda normal
      this.searchService.setSearchTerm(this.searchTerm);
    }
  }

  clearSearch() {
    this.searchTerm = '';
    // 🔥 MODIFICADO: Limpiar todas las búsquedas
    this.searchService.clearGlobalSearch();
    this.searchService.clearSearch();
    this.searchService.clearDashboardSearch();
  }

  // ✅ Nuevo: detectar si está en dashboard
  esDashboard(): boolean {
    return this.router.url === '/dashboard' || this.router.url === '/';
  }
}
