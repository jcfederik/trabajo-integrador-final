// src/app/components/nav-bar/nav-bar.ts
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common'; // <-- Agregar esto
import { SearchService } from '../../services/busqueda/busquedaglobal';

@Component({
  selector: 'nav-bar',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule], // <-- Agregar CommonModule
  templateUrl: './nav-bar.html',
  styleUrls: ['./nav-bar.css']
})
export class NavBar implements OnInit {
  username: string = 'Nahuel';
  searchQuery: string = '';
  currentComponent: string = '';

  constructor(private searchService: SearchService) {}

  ngOnInit() {
    this.searchService.currentComponent$.subscribe(component => {
      this.currentComponent = component;
    });

    this.searchService.searchTerm$.subscribe(term => {
      this.searchQuery = term;
    });
  }

  onSearchChange() {
    this.searchService.setSearchTerm(this.searchQuery);
  }

  onSearch() {
    console.log('Buscando:', this.searchQuery);
    this.searchService.setSearchTerm(this.searchQuery);
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchService.clearSearch();
  }
}
