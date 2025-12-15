import { Component, EventEmitter, Output, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Factura } from '../../services/facturas';
import { Cliente, ClienteService } from '../../services/cliente.service';
import { FacturaReportComponent } from '../factura-report/factura-report';
import { SearchService } from '../../services/busquedaglobal';
import { AlertService } from '../../services/alert.service';

export type ModalView = 'options' | 'clientes' | 'facturas-cliente';

@Component({
  selector: 'app-export-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './export-modal.html',
  styleUrls: ['./export-modal.css']
})
export class ExportModalComponent implements OnInit, OnDestroy {
  @Output() cerrar = new EventEmitter<void>();
  @Output() exportarTodas = new EventEmitter<void>();
  
  vistaActual: ModalView = 'options';
  todosLosClientes: Cliente[] = [];
  clientes: Cliente[] = [];
  facturasCliente: Factura[] = [];
  clienteSeleccionado: Cliente | null = null;
  cargando = false;
  cargandoClientes = false;
  terminoBusqueda = '';

  private alertService = inject(AlertService);

  constructor(
    private clienteService: ClienteService,
    private searchService: SearchService
  ) {}

  // LIFECYCLE
  ngOnInit(): void {
    this.cargarClientes();
  }

  ngOnDestroy(): void {}

  // CARGA DE DATOS
  cargarClientes(): void {
    this.cargandoClientes = true;
    this.clienteService.getClientes(1, 100).subscribe({
      next: (response) => {
        this.todosLosClientes = response.data;
        this.clientes = response.data;
        this.cargandoClientes = false;
      },
      error: (error) => {
        this.cargandoClientes = false;
        this.todosLosClientes = [];
        this.clientes = [];
        this.alertService.showGenericError('Error al cargar los clientes');
      }
    });
  }

  // BÚSQUEDA Y FILTRADO
  onBuscarCliente(): void {
    this.aplicarFiltroClientes();
  }

  private aplicarFiltroClientes(): void {
    if (!this.terminoBusqueda) {
      this.clientes = [...this.todosLosClientes];
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase();
    this.clientes = this.todosLosClientes.filter(cliente => 
      cliente.nombre.toLowerCase().includes(termino) ||
      (cliente.email && cliente.email.toLowerCase().includes(termino)) ||
      (cliente.telefono && cliente.telefono.includes(termino)) ||
      cliente.id.toString().includes(termino)
    );
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.aplicarFiltroClientes();
  }

  // NAVEGACIÓN Y SELECCIÓN
  seleccionarTodasFacturas(): void {
    this.exportarTodas.emit();
    this.cerrarModal();
  }

  seleccionarFacturasCliente(): void {
    this.vistaActual = 'clientes';
    this.terminoBusqueda = '';
    this.clientes = [...this.todosLosClientes];
  }

  seleccionarCliente(cliente: Cliente): void {
    this.clienteSeleccionado = cliente;
    this.cargando = true;
    
    this.clienteService.getTodasFacturasPorCliente(cliente.id).subscribe({
      next: (facturas) => {
        this.facturasCliente = facturas;
        this.vistaActual = 'facturas-cliente';
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        this.facturasCliente = [];
        this.vistaActual = 'facturas-cliente';
        this.alertService.showGenericError('Error al cargar las facturas del cliente');
      }
    });
  }

  seleccionarFactura(factura: Factura): void {
    this.generarReporteIndividual(factura);
  }

  volverAtras(): void {
    switch (this.vistaActual) {
      case 'clientes':
        this.vistaActual = 'options';
        this.terminoBusqueda = '';
        this.clientes = [...this.todosLosClientes];
        break;
      case 'facturas-cliente':
        this.vistaActual = 'clientes';
        this.clienteSeleccionado = null;
        this.facturasCliente = [];
        break;
    }
  }

  // GENERACIÓN DE REPORTES
  private generarReporteCliente(): void {
    const reportComponent = new FacturaReportComponent(this.alertService);
    reportComponent.facturas = this.facturasCliente;
    reportComponent.titulo = `Facturas - ${this.clienteSeleccionado?.nombre}`;
    reportComponent.cliente = this.clienteSeleccionado || undefined;
    reportComponent.generarReporte();
    this.cerrarModal();
    this.alertService.showExportSuccess(`Facturas - ${this.clienteSeleccionado?.nombre}`);
  }

  private generarReporteIndividual(factura: Factura): void {
    const reportComponent = new FacturaReportComponent(this.alertService);
    reportComponent.facturas = [factura];
    reportComponent.titulo = `Factura ${factura.numero}`;
    
    if (this.clienteSeleccionado) {
      reportComponent.cliente = this.clienteSeleccionado;
    }
    
    reportComponent.generarReporte();
    this.cerrarModal();
    this.alertService.showExportSuccess(`Factura ${factura.numero}`);
  }

  descargarTodasFacturasCliente(): void {
    if (!this.clienteSeleccionado || this.facturasCliente.length === 0) {
      this.alertService.showGenericError('No hay facturas para descargar');
      return;
    }
    
    this.generarReporteCliente();
  }

  // UTILIDADES
  cerrarModal(): void {
    this.cerrar.emit();
  }
}