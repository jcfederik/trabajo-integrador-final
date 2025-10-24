import { Component, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavBar } from './components/nav-bar/nav-bar';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavBar, NgIf],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
  constructor(public router: Router) {} 
}
