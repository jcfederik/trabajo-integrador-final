// nav-bar.component.ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'nav-bar',
  standalone: true,      // <-- standalone
  imports: [FormsModule], // necesario para ngModel
  templateUrl: './nav-bar.html',
  styleUrls: ['./nav-bar.css']
})
export class NavBar {
  username: string = 'Nahuel';
  searchQuery: string = '';

  onSearch() {
    console.log('Buscando:', this.searchQuery);
  }
}
