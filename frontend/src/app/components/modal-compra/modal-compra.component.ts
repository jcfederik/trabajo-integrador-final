import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ProveedoresService, Proveedor } from '../../services/proveedores.service';
import { CompraRepuestoService } from '../../services/compra-repuesto.service';
import { Repuesto } from '../../services/repuestos.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SearchSelectorComponent, SearchResult } from '../search-selector/search-selector.component';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-modal-compra-repuesto',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchSelectorComponent],
  templateUrl: './modal-compra.component.html',
  styleUrls: ['./modal-compra.component.css']
})
export class ModalCompraRepuestoComponent {
  @Input() mostrar = false;
  @Input() repuestos: Repuesto[] = [];

  @Output() cerrar = new EventEmitter<void>();
  @Output() compraRealizada = new EventEmitter<void>();

  @ViewChild('selectorProveedor', { static: false })
  selectorProveedor!: SearchSelectorComponent;

  selectedProveedor: SearchResult | null = null;

  compra = {
    proveedor_id: null as number | null,
    repuesto_id: null as number | null,
    cantidad: 1,
    numero_comprobante: ''
  };

  constructor(
    private proveedoresService: ProveedoresService,
    private compraService: CompraRepuestoService,
    private alertService: AlertService
  ) {}

  // BUSCAR PROVEEDORES
  buscarProveedores(term: string) {
    if (!term || term.trim().length < 2) {
      this.selectorProveedor.updateSuggestions([]);
      return;
    }

    this.proveedoresService.buscarProveedores(term).subscribe({
      next: (res: any) => {
          const lista = Array.isArray(res) ? res : res.data ?? [];
          const mapped: SearchResult[] = lista.map((p: Proveedor) => ({
              id: p.id!,
              nombre: p.razon_social,
              telefono: p.telefono,
              email: p.email
          }));
          this.selectorProveedor.updateSuggestions(mapped);
      },
      error: err => {}
    });
  }

  // CARGAR PROVEEDORES INICIALES
  cargarProveedoresIniciales() {
    this.proveedoresService.getProveedores(1, 20).subscribe({
      next: (res) => {
        const mapped: SearchResult[] = (res.data ?? []).map(p => ({
          id: p.id!,
          nombre: p.razon_social,
          telefono: p.telefono,
          email: p.email
        }));
        this.selectorProveedor.updateSuggestions(mapped);
      }
    });
  }

  // SELECCIONAR PROVEEDOR
  seleccionarProveedor(item: SearchResult) {
    this.selectedProveedor = item;
    this.compra.proveedor_id = item.id;
  }

  // LIMPIAR PROVEEDOR
  limpiarProveedor() {
    this.selectedProveedor = null;
    this.compra.proveedor_id = null;
  }

  // REGISTRAR COMPRA
  registrarCompra() {
    if (!this.compra.proveedor_id) {
      this.alertService.showValidationError("Proveedor");
      return;
    }
    if (!this.compra.repuesto_id) {
      this.alertService.showValidationError("Repuesto");
      return;
    }
    if (!this.compra.cantidad || this.compra.cantidad < 1) {
      this.alertService.showValidationError("Cantidad");
      return;
    }

    const rep = this.repuestos.find(
      r => Number(r.id) === Number(this.compra.repuesto_id)
    );

    if (!rep) {
      this.alertService.showGenericError("El repuesto seleccionado no existe.");
      return;
    }

    const precioUnitario = Number(rep.costo_base);
    const total = precioUnitario * this.compra.cantidad;

    const payload = {
      proveedor_id: this.compra.proveedor_id,
      repuesto_id: this.compra.repuesto_id,
      cantidad: this.compra.cantidad,
      numero_comprobante: this.compra.numero_comprobante?.trim() || "SIN-COMPROBANTE",
      precio_unitario: precioUnitario,
      total: total,
      estado: "procesado"
    };

    this.cerrarModal();

    this.alertService.showLoading("Registrando compra...");

    this.compraService.crearCompra(payload).subscribe({
      next: () => {
        this.alertService.closeLoading();
        this.alertService.showToast("Compra registrada correctamente.");
        this.compraRealizada.emit();
      },
      error: (err) => {
        this.alertService.closeLoading();
        const msg = err.error?.error || "No se pudo registrar la compra";
        this.alertService.showGenericError(msg);
      }
    });
  }

  // CERRAR MODAL
  cerrarModal() {
    this.compra = {
      proveedor_id: null,
      repuesto_id: null,
      cantidad: 1,
      numero_comprobante: ''
    };

    this.selectedProveedor = null;

    if (this.selectorProveedor) {
      this.selectorProveedor.clearAll();
    }

    this.cerrar.emit();
  }
}