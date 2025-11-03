import { Component, EventEmitter, Output, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// imports ✨
import { Subscription, Subject, EMPTY, firstValueFrom } from 'rxjs';
import { debounceTime, switchMap, tap, finalize } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

interface Presupuesto {
  id: number;
  reparacion_id: number;
  fecha: string;
  monto_total: number|null;
  aceptado: boolean;
}
interface Reparacion {
  id: number;
  equipo_id: number;
  usuario_id: number;
  descripcion: string;
  fecha: string;
  estado: string;
  // si tu back entrega equipo/cliente anidados, agregalos acá
}
interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  next_page_url: string|null;
  per_page: number;
  total: number;
}

@Component({
  selector: 'app-presupuesto-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './presupuesto-picker.html',
  styleUrls: ['./presupuesto-picker.css']
})
export class PresupuestoPickerComponent implements OnInit, OnDestroy {
  @Output() closed = new EventEmitter<void>();
  @Output() select = new EventEmitter<{
    presupuesto: Presupuesto,
    reparacion?: Reparacion,
    // cliente?: Cliente // si tuvieras
  }>();


  usar(it: { presupuesto: Presupuesto; reparacion?: Reparacion }): void {
    // emitir selección al padre
    this.select.emit(it);
    // cerrar modal
    this.visible = false;
    this.closed.emit();
  }


  // UI state
  visible = false;
  loading = false;
  loadingMore = false;
  error: string | null = null;

  // búsqueda
  term = '';
  private search$ = new Subject<string>();

  // datos
  items: Array<{
    presupuesto: Presupuesto;
    reparacion?: Reparacion;
    matchScore?: number;
  }> = [];

  // paginación para carga progresiva
  page = 1;
  perPage = 10;
  lastPage = false;

  private subs: Subscription[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // stream de búsqueda
    this.subs.push(
      this.search$.pipe(
        debounceTime(250),
        tap(() => this.resetList()),
        switchMap(() => this.fetchPage()) // trae primera página con el término actual (para número filtra en FE)
      ).subscribe()
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  // API mínimas (ajusta endpoints a tus services reales)
  private listPresupuestos(page: number, perPage: number) {
    return this.http.get<Paginated<Presupuesto>>(`http://127.0.0.1:8000/api/presupuestos?page=${page}&per_page=${perPage}`);
  }
  private showReparacion(id: number) {
    return this.http.get<Reparacion>(`http://127.0.0.1:8000/api/reparaciones/${id}`);
  }

  // apertura/cierre
  open() {
    this.visible = true;
    if (this.items.length === 0) {
      this.resetList();
      this.fetchPage().subscribe();
    }
  }
  close() {
    this.visible = false;
    this.closed.emit();
  }

  onInput() {
    this.search$.next(this.term.trim());
  }

  private resetList() {
    this.items = [];
    this.page = 1;
    this.lastPage = false;
    this.error = null;
  }

  // ⬇️ Reemplazá TODO el método por esto
fetchPage() {
  if (this.loading || this.lastPage) return EMPTY; // evita múltiples requests

  const firstLoad = this.items.length === 0;
  if (firstLoad) this.loading = true; else this.loadingMore = true;

  const termLower = this.term.toLowerCase();

  return this.listPresupuestos(this.page, this.perPage).pipe(
    switchMap(async (res) => {
      // 1) filtro por número (si es que el usuario escribió dígitos)
      let data = res.data;
      if (termLower) {
        const looksLikeNumber = /^\d+$/.test(termLower);
        if (looksLikeNumber) {
          data = data.filter(p => ('' + p.id).includes(termLower));
        }
      }

      // 2) enriquecimiento lazy con Reparación
      const enriched = await Promise.all(
        data.map(async p => {
          try {
            const rep = await firstValueFrom(this.showReparacion(p.reparacion_id));
            let matchScore = 0;
            if (termLower && !/^\d+$/.test(termLower)) {
              // mientras no haya cliente, usamos descripcion como "texto" para matchear
              const hay = (rep?.descripcion ?? '').toLowerCase().includes(termLower);
              matchScore = hay ? 1 : 0;
            }
            return { presupuesto: p, reparacion: rep, matchScore };
          } catch {
            return { presupuesto: p };
          }
        })
      );

      // 3) priorizar coincidencias textuales
      if (termLower && !/^\d+$/.test(termLower)) {
        enriched.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
      }

      this.items = [...this.items, ...enriched];
      this.page++;
      this.lastPage = (res.next_page_url === null) || (this.page > res.last_page);
    }),
    finalize(() => {
      this.loading = false;
      this.loadingMore = false;
    })
  );
}}