import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Factura } from '../../services/facturas';
import { Cliente, ClienteService } from '../../services/cliente.service';
import { FacturaReportComponent } from '../factura-report/factura-report';
import { SearchService } from '../../services/busquedaglobal';

export type ModalView = 'options' | 'clientes' | 'facturas-cliente';

@Component({
  selector: 'app-export-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, FacturaReportComponent],
  templateUrl: './export-modal.html',
  styleUrls: ['./export-modal.css']
})
export class ExportModalComponent implements OnInit, OnDestroy {
  
  // =============== OUTPUTS ===============
  @Output() cerrar = new EventEmitter<void>();
  @Output() exportarTodas = new EventEmitter<void>();
  
  // =============== ESTADOS DEL MODAL ===============
  vistaActual: ModalView = 'options';
  todosLosClientes: Cliente[] = [];
  clientes: Cliente[] = [];
  facturasCliente: Factura[] = [];
  clienteSeleccionado: Cliente | null = null;
  cargando = false;
  cargandoClientes = false;
  terminoBusqueda = '';

  constructor(
    private clienteService: ClienteService,
    private searchService: SearchService
  ) {}

  // =============== LIFECYCLE ===============
  ngOnInit(): void {
    this.cargarClientes();
  }

  ngOnDestroy(): void {}

  // =============== CARGA DE DATOS ===============
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
      }
    });
  }

  // =============== BÚSQUEDA Y FILTRADO ===============
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

  // =============== NAVEGACIÓN Y SELECCIÓN ===============
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

  // =============== GENERACIÓN DE REPORTES ===============
  descargarTodasFacturasCliente(): void {
    if (!this.clienteSeleccionado || this.facturasCliente.length === 0) {
      alert('No hay facturas para descargar');
      return;
    }
    
    this.generarReporteCliente();
  }

  private generarReporteCliente(): void {
    const reportComponent = new FacturaReportComponent();
    reportComponent.facturas = this.facturasCliente;
    reportComponent.titulo = `Facturas - ${this.clienteSeleccionado?.nombre}`;
    reportComponent.cliente = this.clienteSeleccionado || undefined;
    reportComponent.generarReporte();
    this.cerrarModal();
  }

  generarReporteIndividual(factura: Factura): void {
    const reportComponent = new FacturaReportComponent();
    reportComponent.facturas = [factura];
    reportComponent.titulo = `Factura ${factura.numero}`;
    
    if (this.clienteSeleccionado) {
      reportComponent.cliente = this.clienteSeleccionado;
    }
    
    reportComponent.generarReporte();
    this.cerrarModal();
  }

  // =============== UTILIDADES ===============
  cerrarModal(): void {
    this.cerrar.emit();
  }
}