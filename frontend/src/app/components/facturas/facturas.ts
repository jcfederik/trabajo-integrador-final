import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaService, Factura, Paginated } from '../../services/facturas';
import { PresupuestoService, Presupuesto } from '../../services/presupuesto.service';
import { ReparacionService, Reparacion } from '../../services/reparacion.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

type Accion = 'listar' | 'crear';

// Nuevo tipo para el formulario
type FacturaForm = Omit<Factura, 'fecha' | 'monto_total' | 'id'> & {
  id?: number;
  fecha: string;
  monto_total: number | string | null;
  presupuestoBusqueda: string;
  presupuestoSeleccionado?: Presupuesto;
};

@Component({
  selector: 'app-facturas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './facturas.html',
  styleUrls: ['./facturas.css']
})
export class FacturasComponent implements OnInit, OnDestroy {
  selectedAction: Accion = 'listar';

  // listado + paginación
  facturas: Factura[] = [];
  page = 1;
  perPage = 10;
  lastPage = false;
  loading = false;

  // edición inline
  editingId: number | null = null;
  editBuffer: Partial<Factura> = {};

  // creación con búsqueda inteligente
  nuevo: FacturaForm = {
    presupuesto_id: undefined as any,
    numero: '',
    letra: 'A',
    fecha: new Date().toISOString().slice(0, 10),
    monto_total: null,
    detalle: '',
    presupuestoBusqueda: ''
  };

  // Para búsqueda de presupuestos
  presupuestosSugeridos: Presupuesto[] = [];
  mostrandoPresupuestos = false;
  buscandoPresupuestos = false;
  private busquedaPresupuesto = new Subject<string>();
  private reparacionesCache = new Map<number, string>();

  constructor(
    private facService: FacturaService,
    private presupuestoService: PresupuestoService,
    private reparacionService: ReparacionService
  ) {}

  ngOnInit(): void {
    this.cargar();
    window.addEventListener('scroll', this.onScroll, { passive: true });
    
    // Configurar búsqueda de presupuestos
    this.busquedaPresupuesto.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(termino => {
      this.buscarPresupuestos(termino);
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    this.busquedaPresupuesto.unsubscribe();
  }

  seleccionarAccion(a: Accion) { this.selectedAction = a; }

  // ====== LISTA / SCROLL ======
  cargar(): void {
    if (this.loading || this.lastPage) return;
    this.loading = true;

    this.facService.list(this.page, this.perPage).subscribe({
      next: (res: Paginated<Factura>) => {
        this.facturas = [...this.facturas, ...res.data];
        this.page++;
        this.lastPage = res.next_page_url === null || this.page > res.last_page;
        this.loading = false;
      },
      error: (e) => { console.error('Error al obtener facturas', e); this.loading = false; }
    });
  }

  onScroll = () => {
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 120;
    if (nearBottom) this.cargar();
  };

  // ====== BÚSQUEDA INTELIGENTE DE PRESUPUESTOS ======

  onBuscarPresupuesto(termino: string): void {
    this.busquedaPresupuesto.next(termino);
  }

  // En el método buscarPresupuestos
  buscarPresupuestos(termino: string): void {
    const terminoLimpio = termino || '';
    
    console.log('🎯 Buscando presupuestos con:', terminoLimpio);
    
    if (!terminoLimpio.trim()) {
      this.presupuestosSugeridos = [];
      this.mostrandoPresupuestos = false;
      return;
    }

    this.buscandoPresupuestos = true;
    
    this.presupuestoService.buscarPresupuestos(terminoLimpio).subscribe({
      next: (presupuestos: Presupuesto[]) => {
        console.log('✅ Resultados encontrados:', presupuestos);
        this.presupuestosSugeridos = presupuestos;
        this.mostrandoPresupuestos = true;
        this.buscandoPresupuestos = false;
        
        // Las descripciones ya vienen incluidas del servicio
        if (this.presupuestosSugeridos.length > 0) {
          console.log('🎯 Presupuestos cargados con descripciones incluidas');
        }
      },
      error: (e) => {
        console.error('💥 Error en búsqueda:', e);
        this.buscandoPresupuestos = false;
        this.presupuestosSugeridos = [];
        this.mostrandoPresupuestos = false;
      }
    });
  }

  seleccionarPresupuesto(presupuesto: Presupuesto): void {
    this.nuevo.presupuestoSeleccionado = presupuesto;
    this.nuevo.presupuesto_id = presupuesto.id;
    this.nuevo.presupuestoBusqueda = `Presupuesto #${presupuesto.id}`;
    this.mostrandoPresupuestos = false;

    // Sugerir valores automáticamente
    if (!this.nuevo.monto_total && presupuesto.monto_total != null) {
      this.nuevo.monto_total = presupuesto.monto_total;
    }
    
    if (!this.nuevo.detalle) {
      this.nuevo.detalle = `Factura asociada al presupuesto #${presupuesto.id}`;
    }
  }

  limpiarPresupuesto(): void {
    this.nuevo.presupuestoSeleccionado = undefined;
    this.nuevo.presupuesto_id = undefined as any;
    this.nuevo.presupuestoBusqueda = '';
    this.presupuestosSugeridos = [];
    this.mostrandoPresupuestos = false;
  }

  ocultarPresupuestos(): void {
    setTimeout(() => {
      this.mostrandoPresupuestos = false;
    }, 200);
  }

  // ====== GESTIÓN DE DESCRIPCIONES DE REPARACIONES ======

  // Y actualiza el método getDescripcionReparacion para usar la propiedad del servicio
  getDescripcionReparacion(reparacionId: number): string {
    // Si ya tenemos el presupuesto en los sugeridos, usar su descripción
    const presupuesto = this.presupuestosSugeridos.find(p => p.reparacion_id === reparacionId);
    if (presupuesto?.reparacion_descripcion) {
      return presupuesto.reparacion_descripcion;
    }
    
    // Fallback al método original
    if (this.reparacionesCache.has(reparacionId)) {
      return this.reparacionesCache.get(reparacionId) || `Reparación #${reparacionId}`;
    }

    this.cargarDescripcionReparacion(reparacionId);
    return `Reparación #${reparacionId}`;
  }

  private cargarDescripcionReparacion(reparacionId: number): void {
    this.reparacionService.show(reparacionId).subscribe({
      next: (reparacion) => {
        const descripcion = reparacion.descripcion || `Reparación #${reparacionId}`;
        this.reparacionesCache.set(reparacionId, descripcion);
      },
      error: (e) => {
        console.error('Error al cargar reparación', e);
        this.reparacionesCache.set(reparacionId, `Reparación #${reparacionId}`);
      }
    });
  }

  // ====== CREAR ======
  crear(): void {
    const payload = this.limpiar(this.nuevo);
    if (!this.valida(payload)) return;
    payload.fecha = this.toISODate(payload.fecha as string);

    this.facService.create(payload).subscribe({
      next: () => {
        this.resetLista();
        this.nuevo = { 
          presupuesto_id: undefined as any, 
          numero: '', 
          letra: 'A', 
          fecha: new Date().toISOString().slice(0,10), 
          monto_total: null, 
          detalle: '',
          presupuestoBusqueda: ''
        };
        this.selectedAction = 'listar';
      },
      error: (e) => { 
        console.error('Error al crear factura', e); 
        alert(e?.error?.error ?? 'Error al crear la factura'); 
      }
    });
  }

  // ====== ELIMINAR ======
  eliminar(id: number): void {
    if (!confirm('¿Eliminar esta factura?')) return;
    this.facService.delete(id).subscribe({
      next: () => { this.facturas = this.facturas.filter(f => f.id !== id); },
      error: (e) => { console.error('Error al eliminar factura', e); alert(e?.error?.error ?? 'No se pudo eliminar'); }
    });
  }

  // ====== EDICIÓN INLINE ======
  startEdit(item: Factura): void {
    this.editingId = item.id;
    this.editBuffer = {
      presupuesto_id: item.presupuesto_id,
      numero: item.numero,
      letra: item.letra,
      fecha: (item.fecha ?? '').slice(0,10),
      monto_total: item.monto_total,
      detalle: item.detalle
    };
  }

  cancelEdit(): void { this.editingId = null; this.editBuffer = {}; }

  saveEdit(id: number): void {
    const payload = this.limpiar(this.editBuffer);
    if (!this.valida(payload)) return;
    payload.fecha = this.toISODate(payload.fecha as string);

    this.facService.update(id, payload).subscribe({
      next: () => {
        const idx = this.facturas.findIndex(f => f.id === id);
        if (idx >= 0) this.facturas[idx] = { ...this.facturas[idx], ...payload, fecha: payload.fecha! } as Factura;
        this.cancelEdit();
      },
      error: (e) => { console.error('Error al actualizar factura', e); alert(e?.error?.error ?? 'Error al actualizar'); }
    });
  }

  // ====== EXPORTAR A PDF (Print) ======
  exportarPDF(): void {
    // Construyo HTML limpio y responsivo para imprimir/guardar PDF
    const rows = this.facturas.map(f => `
      <tr>
        <td>${f.numero}</td>
        <td>${f.letra}</td>
        <td>${(f.fecha || '').slice(0,10)}</td>
        <td>${(f.monto_total ?? '').toLocaleString?.('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? f.monto_total}</td>
        <td>${f.detalle ?? ''}</td>
      </tr>
    `).join('');

    const popup = window.open('', '_blank', 'width=1024,height=768');
    if (!popup) return;

    popup.document.write(`
      <html>
      <head>
        <title>Facturas</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
        <style>
          @media print {
            .no-print { display: none !important; }
          }
          body { padding: 24px; }
          h3 { margin-bottom: 1rem; }
          table { font-size: 12px; }
          th, td { vertical-align: middle !important; }
        </style>
      </head>
      <body>
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="m-0">Listado de Facturas</h3>
          <button class="btn btn-primary no-print" onclick="window.print()">Imprimir / Guardar PDF</button>
        </div>
        <div class="table-responsive">
          <table class="table table-striped table-bordered align-middle">
            <thead class="table-light">
              <tr>
                <th>Número</th>
                <th>Letra</th>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>${rows || `<tr><td colspan="5" class="text-center text-muted">Sin datos</td></tr>`}</tbody>
          </table>
        </div>
      </body></html>
    `);
    popup.document.close();
    popup.focus();
  }

  // ====== Helpers ======
  public resetLista() {
    this.facturas = [];
    this.page = 1;
    this.lastPage = false;
    this.cargar();
  }

  private limpiar(obj: Partial<FacturaForm>): Partial<Factura> {
    const presupuestoId = typeof obj.presupuesto_id === 'string'
      ? Number(obj.presupuesto_id)
      : obj.presupuesto_id;

    let monto: number;
    if (obj.monto_total == null || obj.monto_total === '') {
      monto = 0; // valor por defecto
    } else if (typeof obj.monto_total === 'string') {
      const trimmed = obj.monto_total.trim();
      monto = trimmed === '' ? 0 : Number(trimmed.replace(',', '.'));
    } else {
      monto = obj.monto_total;
    }

    return {
      presupuesto_id: presupuestoId!,
      numero: (obj.numero ?? '').toString().trim(),
      letra: (obj.letra ?? '').toString().trim().toUpperCase(),
      fecha: (obj.fecha ?? '').toString().slice(0,10),
      monto_total: monto,
      detalle: (obj.detalle ?? '').toString().trim()
    };
  }

  private valida(p: Partial<Factura>): boolean {
    if (!p.presupuesto_id || !p.numero || !p.letra || !p.fecha || p.monto_total === undefined || p.monto_total === null) {
      alert('Completá: presupuesto_id, número, letra, fecha y monto_total.');
      return false;
    }
    if (isNaN(Number(p.presupuesto_id)) || Number(p.presupuesto_id) <= 0) { alert('presupuesto_id inválido.'); return false; }
    if (isNaN(Number(p.monto_total))) { alert('monto_total debe ser numérico.'); return false; }
    return true;
  }

  private toISODate(yyyyMMdd: string): string {
    return new Date(yyyyMMdd + 'T00:00:00Z').toISOString();
  }
}