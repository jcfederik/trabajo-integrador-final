import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Factura } from '../../services/facturas';
import { Cliente, ClienteService } from '../../services/cliente.service';
import { FacturaReportComponent } from '../factura-report/factura-report';
import { SearchService } from '../../services/busquedaglobal';

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
  
  // Estados del modal
  vistaActual: ModalView = 'options';
  todosLosClientes: Cliente[] = [];
  clientes: Cliente[] = [];
  facturasCliente: Factura[] = [];
  clienteSeleccionado: Cliente | null = null;
  cargando = false;
  cargandoClientes = false;
  terminoBusqueda = '';

  // Suscripción para búsqueda global
  private searchSub?: Subscription;

  constructor(
    private clienteService: ClienteService,
    private searchService: SearchService
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
    
    // Integrar con buscador global
    this.searchService.setCurrentComponent('clientes');
    this.searchSub = this.searchService.searchTerm$.subscribe(term => {
      this.terminoBusqueda = (term || '').trim();
      this.aplicarFiltroClientes();
    });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
    this.searchService.clearSearch();
  }

  cargarClientes(): void {
    this.cargandoClientes = true;
    this.clienteService.getClientes(1, 100).subscribe({
      next: (response) => {
        this.todosLosClientes = response.data;
        this.clientes = response.data;
        this.cargandoClientes = false;
        this.searchService.setSearchData(this.todosLosClientes);
      },
      error: (error) => {
        console.error('❌ Error cargando clientes:', error);
        this.cargandoClientes = false;
        this.todosLosClientes = [];
        this.clientes = [];
      }
    });
  }

  // 🔥 BÚSQUEDA LOCAL - NO HTTP
  onBuscarCliente(): void {
    // Solo actualizar el término - el filtro se aplica automáticamente vía subscription
    this.searchService.setSearchTerm(this.terminoBusqueda);
  }

  // Aplicar filtro localmente
  private aplicarFiltroClientes(): void {
    if (!this.terminoBusqueda) {
      this.clientes = [...this.todosLosClientes];
      return;
    }

    this.clientes = this.searchService.search(
      this.todosLosClientes, 
      this.terminoBusqueda, 
      'clientes'
    );
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.searchService.setSearchTerm('');
  }

  seleccionarTodasFacturas(): void {
    this.exportarTodas.emit();
    this.cerrarModal();
  }

  seleccionarFacturasCliente(): void {
    this.vistaActual = 'clientes';
    this.terminoBusqueda = '';
    this.clientes = [...this.todosLosClientes];
    this.searchService.setSearchTerm('');
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
        console.error('❌ Error cargando facturas:', error);
        this.cargando = false;
        this.facturasCliente = [];
        this.vistaActual = 'facturas-cliente';
      }
    });
  }

  seleccionarFactura(factura: Factura): void {
    this.generarReporteIndividual(factura);
    this.cerrarModal();
  }

  descargarTodasFacturasCliente(): void {
    if (!this.clienteSeleccionado || this.facturasCliente.length === 0) {
      alert('No hay facturas para descargar');
      return;
    }
    
    const reportComponent = new FacturaReportComponent();
    reportComponent.facturas = this.facturasCliente;
    reportComponent.titulo = `Facturas - ${this.clienteSeleccionado.nombre}`;
    reportComponent.generarReporte();
  }

  generarReporteIndividual(factura: Factura): void {
    const reportComponent = new FacturaReportComponent();
    reportComponent.facturas = [factura];
    reportComponent.titulo = `Factura ${factura.numero}`;
    reportComponent.generarReporte();
  }

  volverAtras(): void {
    switch (this.vistaActual) {
      case 'clientes':
        this.vistaActual = 'options';
        this.terminoBusqueda = '';
        this.searchService.setSearchTerm('');
        break;
      case 'facturas-cliente':
        this.vistaActual = 'clientes';
        this.clienteSeleccionado = null;
        this.facturasCliente = [];
        break;
    }
  }

  cerrarModal(): void {
    this.searchService.clearSearch();
    this.cerrar.emit();
  }
}