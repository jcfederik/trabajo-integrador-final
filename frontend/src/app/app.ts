import { Component, signal } from '@angular/core';
<<<<<<< Updated upstream
import { Router, RouterOutlet } from '@angular/router';
import { NavBar } from './components/nav-bar/nav-bar';
=======
import { RouterOutlet, Router } from '@angular/router';
import { NavBarComponent } from './components/nav-bar/nav-bar';
>>>>>>> Stashed changes
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
<<<<<<< Updated upstream
  imports: [RouterOutlet, NavBar, NgIf],
=======
  imports: [RouterOutlet, NavBarComponent, NgIf, SidebarComponent],
>>>>>>> Stashed changes
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
  constructor(public router: Router) {} 
}
