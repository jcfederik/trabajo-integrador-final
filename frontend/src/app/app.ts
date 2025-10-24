import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBar } from './components/nav-bar/nav-bar';
import { SidebarComponent } from "./sidebar/sidebar";

@Component({
  selector: 'app-root',
  standalone: true,   
  imports: [RouterOutlet, NavBar, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
