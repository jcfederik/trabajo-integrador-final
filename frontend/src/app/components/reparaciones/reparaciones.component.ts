import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ReparacionService,
  Reparacion,
  Paginated,
} from '../../services/reparacion.service';

type Acción = 'listar'|'crear';

@Component({
  selector: 'app-reparaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reparaciones.component.html',
  styleUrls: ['./reparaciones.component.css']
})
export class ReparacionesComponent implements OnInit, OnDestroy {
  selectedAction: Acción = 'listar';

  // listado + paginación
  reparaciones: Reparacion[] = [];
  page = 1;
  perPage = 10;
  lastPage = false;
  loading = false;

  // edición inline
  editingId: number | null = null;
  editBuffer: Partial<Reparacion> = {};

  // creación
  nuevo: Partial<Reparacion> = {
    fecha: new Date().toISOString().slice(0,10), // yyyy-MM-dd
    estado: 'pendiente'
  };

  constructor(private repService: ReparacionService) {}

  ngOnInit(): void {
    this.cargar();
    window.addEventListener('scroll', this.onScroll);
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
  }

  seleccionarAccion(a: Acción) {
    this.selectedAction = a;
  }

  // ====== LISTA / SCROLL ======
  cargar() {
    if (this.loading || this.lastPage) return;
    this.loading = true;

    this.repService.list(this.page, this.perPage).subscribe({
      next: (res: Paginated<Reparacion>) => {
        this.reparaciones = [...this.reparaciones, ...res.data];
        this.page++;
        this.lastPage = (res.next_page_url === null);
        this.loading = false;
      },
      error: (e) => {
        console.error('Error al obtener reparaciones', e);
        this.loading = false;
      }
    });
  }

  onScroll = () => {
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 120;
    if (nearBottom) this.cargar();
  };

  // ====== CREAR ======
  crear() {
    // placeholders: equipo_id y usuario_id como numbers
    if (!this.nuevo.equipo_id || !this.nuevo.usuario_id || !this.nuevo.descripcion || !this.nuevo.fecha || !this.nuevo.estado) {
      alert('Completá equipo_id, usuario_id, descripción, fecha y estado.');
      return;
    }
    this.repService.create(this.nuevo).subscribe({
      next: () => {
        // reset lista y repedir desde página 1
        this.reparaciones = [];
        this.page = 1;
        this.lastPage = false;
        this.cargar();
        this.nuevo = { fecha: new Date().toISOString().slice(0,10), estado: 'pendiente' };
        this.selectedAction = 'listar';
      },
      error: (e) => {
        console.error('Error al crear reparación', e);
        alert(e?.error?.error ?? 'Error al crear la reparación');
      }
    });
  }

  // ====== ELIMINAR ======
  eliminar(id: number) {
    if (!confirm('¿Eliminar esta reparación?')) return;
    this.repService.delete(id).subscribe({
      next: () => {
        this.reparaciones = this.reparaciones.filter(r => r.id !== id);
      },
      error: (e) => {
        console.error('Error al eliminar reparación', e);
      }
    });
  }

  // ====== EDICIÓN INLINE ======
  startEdit(item: Reparacion) {
    this.editingId = item.id;
    // clonamos sólo lo editable
    this.editBuffer = {
      equipo_id: item.equipo_id,
      usuario_id: item.usuario_id,
      descripcion: item.descripcion,
      fecha: item.fecha?.slice(0,10),
      estado: item.estado,
    };
  }

  cancelEdit() {
    this.editingId = null;
    this.editBuffer = {};
  }

  saveEdit(id: number) {
    this.repService.update(id, this.editBuffer).subscribe({
      next: (res: any) => {
        // actualizamos en memoria
        const idx = this.reparaciones.findIndex(r => r.id === id);
        if (idx >= 0) {
          this.reparaciones[idx] = { ...this.reparaciones[idx], ...this.editBuffer } as Reparacion;
        }
        this.cancelEdit();
      },
      error: (e) => {
        console.error('Error al actualizar reparación', e);
        alert(e?.error?.error ?? 'Error al actualizar la reparación');
      }
    });
  }
}
