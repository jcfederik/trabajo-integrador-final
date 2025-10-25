import { Component, signal } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { NavBar} from './components/nav-bar/nav-bar';
import { NgIf } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavBar, NgIf, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
  constructor(public router: Router) {} 
}
