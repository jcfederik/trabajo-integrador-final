// src/app/services/search.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SearchableItem {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private currentComponent = new BehaviorSubject<string>('');
  private searchTerm = new BehaviorSubject<string>('');
  private searchData = new BehaviorSubject<any[]>([]);
  
  currentComponent$ = this.currentComponent.asObservable();
  searchTerm$ = this.searchTerm.asObservable();
  searchData$ = this.searchData.asObservable();

  setCurrentComponent(component: string) {
    this.currentComponent.next(component);
  }

  setSearchTerm(term: string) {
    this.searchTerm.next(term);
  }

  setSearchData(data: any[]) {
    this.searchData.next(data);
  }

  clearSearch() {
    this.searchTerm.next('');
  }

  // 🔥 MÉTODO MEJORADO - Búsqueda por palabras individuales
  search<T extends SearchableItem>(items: T[], term: string): T[] {
    if (!term) return items;
    
    const normalizedTerm = term.trim().toLowerCase();
    
    if (!normalizedTerm) return items;
    
    // Dividir el término de búsqueda en palabras individuales
    const searchWords = normalizedTerm.split(/\s+/).filter(word => word.length > 0);
    
    // Si no hay palabras después de dividir, retornar todos los items
    if (searchWords.length === 0) return items;
    
    return items.filter(item => {
      // Crear un string con todos los campos buscables
      const searchableText = [
        item.nombre,
        item.email,
        item.telefono
      ]
        .filter(Boolean) // Remover valores null/undefined
        .join(' ') // Unir con espacios
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remover acentos
      
      // Verificar que TODAS las palabras estén presentes en el texto buscable
      return searchWords.every(word => {
        const cleanWord = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return searchableText.includes(cleanWord);
      });
    });
  }
}