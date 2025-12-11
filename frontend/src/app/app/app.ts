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
  showNavbar = false;
  showSidebar = false;
  sidebarCollapsed = false;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        const url = event.urlAfterRedirects;

        const rutasSinLayout = ['/login'];

        if (rutasSinLayout.includes(url)) {
          this.showNavbar = false;
          this.showSidebar = false;
        } else if (url === '/dashboard') {
          this.showNavbar = true;
          this.showSidebar = false;
        } else {
          this.showNavbar = true;
          this.showSidebar = true;
        }
      });
  }

  // 🔧 Necesario para tu app.html
  onSidebarStateChange(collapsed: boolean) {
    this.sidebarCollapsed = collapsed;
  }
}
