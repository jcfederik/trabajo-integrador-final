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

  // Inputs básicos
  @Input() facturaId: number = 0;
  @Input() facturaNumero: string = '';
  @Input() montoTotal: number = 0;
  
  @Output() cerrar = new EventEmitter<void>();

  cobros: Cobro[] = [];
  mediosCobro: MedioCobro[] = [];
  saldoInfo: SaldoInfo | null = null;
  
  // Estados
  mostrarModal = false;
  mostrarFormulario = false;
  loading = false;
  procesando = false;
  cargandoMedios = true;

  // ✅ NUEVO: Track de la factura actual
  private facturaActual: number = 0;

  // Formulario
  nuevoCobro: NewCobro = {
    factura_id: 0,
    monto_pagado: 0,
    medio_cobro_id: 0
  };

  ngOnInit() {
    this.cargarMediosCobro();
  }

  // ✅ MÉTODO MEJORADO CON VERIFICACIÓN DE FACTURA
  abrirModal(facturaId: number, facturaNumero: string, montoTotal: number): void {
    console.log('🎯 abrirModal llamado con:', { 
      facturaId, 
      facturaNumero, 
      montoTotal,
      tipoFacturaId: typeof facturaId,
      esValido: facturaId && facturaId > 0
    });

    // ✅ VALIDACIÓN MÁS ESTRICTA
    if (!facturaId || facturaId <= 0 || isNaN(facturaId)) {
      console.error('❌ ID de factura inválido, no se puede abrir modal:', facturaId);
      this.alertService.showError('Error', 'No se puede abrir el modal: ID de factura inválido');
      return;
    }
    
    // ✅ VERIFICAR SI ES LA MISMA FACTURA
    if (this.facturaActual === facturaId && this.mostrarModal) {
      console.log('📋 Ya está mostrando esta factura, no es necesario recargar');
      return;
    }
    
    // ✅ SI ES UNA FACTURA DIFERENTE, LIMPIAR
    if (this.facturaActual !== facturaId) {
      console.log('🆕 Factura diferente detectada, limpiando datos anteriores');
      this.limpiarDatosFactura();
    }
    
    // Establecer los nuevos datos
    this.facturaId = facturaId;
    this.facturaNumero = facturaNumero;
    this.montoTotal = montoTotal;
    this.facturaActual = facturaId; // ✅ Guardar referencia
    this.nuevoCobro.factura_id = facturaId;
    
    // Mostrar modal y cargar datos
    this.mostrarModal = true;
    this.cargarDatosFactura();
  }

  cerrarModal(): void {
    console.log('🔄 Modal - cerrarModal llamado');
    this.mostrarModal = false;
    this.mostrarFormulario = false;
    this.limpiarFormulario();
    this.cerrar.emit();
  }

  // ✅ LIMPIAR SOLO DATOS DE FACTURA (no medios de cobro)
  private limpiarDatosFactura(): void {
    console.log('🧹 Limpiando datos de factura anterior');
    
    // Limpiar solo datos específicos de la factura
    this.cobros = [];
    this.saldoInfo = null;
    this.loading = false;
    this.procesando = false;
    this.mostrarFormulario = false;
    
    // Limpiar formulario pero mantener factura_id si es la misma
    this.limpiarFormulario();
  }

  // ✅ CARGAR DATOS ESPECÍFICOS DE LA FACTURA
  private cargarDatosFactura(): void {
    console.log('🔄 Modal - cargando datos para factura:', this.facturaId);
    
    if (this.facturaId <= 0) return;
    
    this.cargarCobros();
    this.cargarSaldoFactura();
  }

  cargarCobros(): void {
    if (this.facturaId <= 0) return;
    
    this.loading = true;
    console.log('🔄 Modal - cargando cobros para factura:', this.facturaId);
    
    this.facturaService.getCobrosPorFactura(this.facturaId).subscribe({
      next: (cobros: Cobro[]) => {
        console.log('✅ Modal - cobros cargados:', cobros);
        this.cobros = cobros;
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Modal - error cargando cobros:', error);
        this.loading = false;
        this.alertService.showGenericError('Error al cargar los pagos');
      }
    });
  }

  cargarSaldoFactura(): void {
    if (this.facturaId <= 0) {
      console.error('❌ ID de factura inválido:', this.facturaId);
      return;
    }
    
    console.log('🔄 Modal - cargando saldo para factura ID:', this.facturaId);
    console.log('🔗 URL esperada:', `http://127.0.0.1:8000/api/facturas/${this.facturaId}/saldo`);
    
    this.facturaService.getSaldoPendiente(this.facturaId).subscribe({
      next: (saldo) => {
        console.log('✅ Modal - saldo cargado exitosamente:', saldo);
        this.saldoInfo = saldo;
      },
      error: (error) => {
        console.error('❌ Modal - ERROR cargando saldo:', {
          facturaId: this.facturaId,
          error: error,
          status: error.status,
          message: error.message,
          url: error.url,
          errorDetails: error.error
        });
        
        // ✅ MOSTRAR ALERTA ESPECÍFICA
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
        
        // Calcular saldo localmente como fallback
        this.calcularSaldoLocal();
      }
    });
  }

  private calcularSaldoLocal(): void {
    const totalCobrado = this.cobros.reduce((total, cobro) => total + (cobro.monto || 0), 0);
    this.saldoInfo = {
      monto_total: this.montoTotal,
      saldo_pendiente: Math.max(0, this.montoTotal - totalCobrado) // No negativo
    };
  }

  // ✅ CARGAR MEDIOS DE COBRO UNA SOLA VEZ
  private cargarMediosCobro(): void {
    this.cargandoMedios = true;
    console.log('🔄 Modal - cargando medios de cobro');
    
    this.cobroService.getMediosCobro().subscribe({
      next: (medios) => {
        console.log('✅ Modal - medios de cobro cargados:', medios);
        this.mediosCobro = medios;
        this.cargandoMedios = false;
      },
      error: (error) => {
        console.error('❌ Modal - error cargando medios:', error);
        this.cargandoMedios = false;
        this.alertService.showGenericError('Error cargando medios de pago');
      }
    });
  }

  mostrarFormularioPago(): void {
    this.mostrarFormulario = true;
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.limpiarFormulario();
  }

  registrarCobro(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.procesando = true;
    console.log('💾 Intentando registrar cobro:', this.nuevoCobro);

    this.cobroService.registrarCobro(this.nuevoCobro).subscribe({
      next: (response) => {
        console.log('✅ Cobro registrado exitosamente - Respuesta:', response);
        this.procesando = false;
        this.alertService.showSuccess('Pago registrado correctamente');
        this.mostrarFormulario = false;
        this.limpiarFormulario();
        
        // ✅ RECARGAR DATOS PARA VERIFICAR QUE SE GUARDÓ
        console.log('🔄 Recargando datos después de registrar cobro...');
        this.cargarCobros();
        this.cargarSaldoFactura();
      },
      error: (error) => {
        console.error('❌ Error registrando cobro:', error);
        this.procesando = false;
        const mensaje = error.error?.error || 'Error al registrar el pago';
        this.alertService.showGenericError(mensaje);
      }
    });
  }

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

  private limpiarFormulario(): void {
    this.nuevoCobro = {
      factura_id: this.facturaId,
      monto_pagado: 0,
      medio_cobro_id: 0
    };
  }

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