import { Component, inject, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaService, Cobro, SaldoInfo } from '../../services/facturas';
import { CobroService, NewCobro, MedioCobro } from '../../services/cobro.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-cobros-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cobros-modal.component.html',
  styleUrls: ['./cobros-modal.component.css']
})
export class CobrosModalComponent implements OnInit {
  private facturaService = inject(FacturaService);
  private cobroService = inject(CobroService);
  private alertService = inject(AlertService);

  @Input() facturaId: number = 0;
  @Input() facturaNumero: string = '';
  @Input() montoTotal: number = 0;
  
  @Output() cerrar = new EventEmitter<void>();

  cobros: Cobro[] = [];
  mediosCobro: MedioCobro[] = [];
  saldoInfo: SaldoInfo | null = null;
  
  mostrarModal = false;
  mostrarFormulario = false;
  loading = false;
  procesando = false;
  cargandoMedios = true;

  private facturaActual: number = 0;

  nuevoCobro: NewCobro = {
    factura_id: 0,
    monto_pagado: 0,
    medio_cobro_id: 0
  };

  ngOnInit() {
    this.cargarMediosCobro();
  }

  // ABRIR MODAL
  abrirModal(facturaId: number, facturaNumero: string, montoTotal: number): void {
    if (!facturaId || facturaId <= 0 || isNaN(facturaId)) {
      this.alertService.showError('Error', 'No se puede abrir el modal: ID de factura inválido');
      return;
    }
    
    if (this.facturaActual === facturaId && this.mostrarModal) {
      return;
    }
    
    if (this.facturaActual !== facturaId) {
      this.limpiarDatosFactura();
    }
    
    this.facturaId = facturaId;
    this.facturaNumero = facturaNumero;
    this.montoTotal = montoTotal;
    this.facturaActual = facturaId;
    this.nuevoCobro.factura_id = facturaId;
    
    this.mostrarModal = true;
    this.cargarDatosFactura();
  }

  // CERRAR MODAL
  cerrarModal(): void {
    this.mostrarModal = false;
    this.mostrarFormulario = false;
    this.limpiarFormulario();
    this.cerrar.emit();
  }

  // LIMPIAR DATOS FACTURA
  private limpiarDatosFactura(): void {
    this.cobros = [];
    this.saldoInfo = null;
    this.loading = false;
    this.procesando = false;
    this.mostrarFormulario = false;
    
    this.limpiarFormulario();
  }

  // CARGAR DATOS FACTURA
  private cargarDatosFactura(): void {
    if (this.facturaId <= 0) return;
    
    this.cargarCobros();
    this.cargarSaldoFactura();
  }

  // CARGAR COBROS
  cargarCobros(): void {
    if (this.facturaId <= 0) return;
    
    this.loading = true;
    
    this.facturaService.getCobrosPorFactura(this.facturaId).subscribe({
      next: (cobros: Cobro[]) => {
        this.cobros = cobros;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.alertService.showGenericError('Error al cargar los pagos');
      }
    });
  }

  // CARGAR SALDO FACTURA
  cargarSaldoFactura(): void {
    if (this.facturaId <= 0) {
      return;
    }
    
    this.facturaService.getSaldoPendiente(this.facturaId).subscribe({
      next: (saldo) => {
        this.saldoInfo = saldo;
      },
      error: (error) => {
        if (error.status === 404) {
          this.alertService.showError(
            'Endpoint no encontrado', 
            `No se pudo cargar el saldo. El endpoint /api/facturas/${this.facturaId}/saldo no existe.`
          );
        } else if (error.status === 500) {
          this.alertService.showError(
            'Error del servidor',
            'El servidor tuvo un error interno al calcular el saldo.'
          );
        } else if (error.status === 403) {
          this.alertService.showError(
            'Sin permisos',
            'No tienes permisos para ver el saldo de esta factura.'
          );
        } else {
          this.alertService.showError(
            'Error cargando saldo',
            `Error ${error.status}: ${error.message || 'No se pudo cargar el saldo pendiente'}`
          );
        }
        
        this.calcularSaldoLocal();
      }
    });
  }

  // CALCULAR SALDO LOCAL
  private calcularSaldoLocal(): void {
    const totalCobrado = this.cobros.reduce((total, cobro) => total + (cobro.monto || 0), 0);
    this.saldoInfo = {
      monto_total: this.montoTotal,
      saldo_pendiente: Math.max(0, this.montoTotal - totalCobrado)
    };
  }

  // CARGAR MEDIOS DE COBRO
  private cargarMediosCobro(): void {
    this.cargandoMedios = true;
    
    this.cobroService.getMediosCobro().subscribe({
      next: (medios) => {
        this.mediosCobro = medios;
        this.cargandoMedios = false;
      },
      error: (error) => {
        this.cargandoMedios = false;
        this.alertService.showGenericError('Error cargando medios de pago');
      }
    });
  }

  // MOSTRAR FORMULARIO PAGO
  mostrarFormularioPago(): void {
    this.mostrarFormulario = true;
  }

  // CANCELAR FORMULARIO
  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.limpiarFormulario();
  }

  // REGISTRAR COBRO
  registrarCobro(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.procesando = true;

    this.cobroService.registrarCobro(this.nuevoCobro).subscribe({
      next: (response) => {
        this.procesando = false;
        this.alertService.showSuccess('Pago registrado correctamente');
        this.mostrarFormulario = false;
        this.limpiarFormulario();
        
        this.cargarCobros();
        this.cargarSaldoFactura();
      },
      error: (error) => {
        this.procesando = false;
        const mensaje = error.error?.error || 'Error al registrar el pago';
        this.alertService.showGenericError(mensaje);
      }
    });
  }

  // VALIDAR FORMULARIO
  private validarFormulario(): boolean {
    if (!this.nuevoCobro.factura_id || this.nuevoCobro.factura_id <= 0) {
      this.alertService.showGenericError('ID de factura no válido');
      return false;
    }

    if (!this.nuevoCobro.monto_pagado || this.nuevoCobro.monto_pagado <= 0) {
      this.alertService.showGenericError('Ingrese un monto válido');
      return false;
    }

    if (!this.nuevoCobro.medio_cobro_id) {
      this.alertService.showGenericError('Seleccione un medio de pago');
      return false;
    }

    if (this.saldoInfo && this.nuevoCobro.monto_pagado > this.saldoInfo.saldo_pendiente) {
      this.alertService.showGenericError('El monto excede el saldo pendiente de la factura');
      return false;
    }

    return true;
  }

  // LIMPIAR FORMULARIO
  private limpiarFormulario(): void {
    this.nuevoCobro = {
      factura_id: this.facturaId,
      monto_pagado: 0,
      medio_cobro_id: 0
    };
  }

  // GETTERS
  get totalCobrado(): number {
    return this.cobros.reduce((total, cobro) => total + (cobro.monto || 0), 0);
  }

  get saldoPendiente(): number {
    return this.saldoInfo ? this.saldoInfo.saldo_pendiente : (this.montoTotal || 0) - this.totalCobrado;
  }

  get tieneCobros(): boolean {
    return this.cobros.length > 0;
  }
}