import { Component } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavBar } from '../components/nav-bar/nav-bar';
import { SidebarComponent } from '../components/sidebar/sidebar';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavBar, SidebarComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  sidebarCollapsed = false;
  showSidebar = false;
  showNavbar = false;
  currentRoute = '';

  constructor(private router: Router) {
    // Escuchar cambios de ruta
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.url;
        this.updateComponentVisibility();
      });
  }

  ngOnInit() {
    this.updateComponentVisibility();
  }

  private updateComponentVisibility() {
    const route = this.currentRoute || this.router.url;
    
    // Ocultar sidebar y navbar en login
    if (route.includes('/login')) {
      this.showSidebar = false;
      this.showNavbar = false;
    }
    // En dashboard: mostrar solo navbar, ocultar sidebar
    else if (route === '/dashboard' || route === '/') {
      this.showSidebar = false;
      this.showNavbar = true;
    }
    // En otras rutas: mostrar ambos
    else {
      this.showSidebar = true;
      this.showNavbar = true;
    }
  }

  onSidebarStateChange(collapsed: boolean) {
    this.sidebarCollapsed = collapsed;
  }
}