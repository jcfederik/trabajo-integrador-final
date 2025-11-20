import { Component, Input } from '@angular/core';
import { Factura } from '../../services/facturas';
import { Cliente } from '../../services/cliente.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-factura-report',
  standalone: true,
  template: ''
})
export class FacturaReportComponent {
  
  // =============== INPUTS ===============
  @Input() facturas: Factura[] = [];
  @Input() titulo: string = 'Listado de Facturas';
  @Input() cliente?: Cliente;

  constructor(private alertService: AlertService) {}

  // =============== MÉTODO PRINCIPAL ===============
  generarReporte(): void {
    if (this.facturas.length === 0) {
      this.alertService.showGenericError('No hay facturas para generar el reporte');
      return;
    }

    try {
      this.alertService.showReportLoading();
      
      const doc = new jsPDF();
      
      this.configurarDocumento(doc);
      this.agregarTitulo(doc);
      
      if (this.cliente) {
        this.agregarInfoCliente(doc);
      }
      
      this.agregarTablaFacturas(doc);
      this.agregarTotal(doc);
      
      const fileName = this.generarNombreArchivo();
      doc.save(fileName);
      
      this.alertService.closeLoading();
      this.alertService.showReportSuccess();
      
    } catch (error) {
      this.alertService.closeLoading();
      this.alertService.showReportError();
    }
  }

  // =============== CONFIGURACIÓN DEL DOCUMENTO ===============
  private configurarDocumento(doc: jsPDF): void {
    doc.setProperties({
      title: this.titulo,
      subject: 'Reporte de Facturas',
      creator: 'Sistema de Gestión',
      author: 'Sistema'
    });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
  }

  private agregarTitulo(doc: jsPDF): void {
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text(this.titulo, 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    const fechaGeneracion = `Generado el ${new Date().toLocaleDateString('es-AR')} - ${this.facturas.length} factura(s)`;
    doc.text(fechaGeneracion, 14, 30);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 35, 196, 35);
  }

  private agregarInfoCliente(doc: jsPDF): void {
    if (!this.cliente) return;
    
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    
    doc.text(`Cliente: ${this.cliente.nombre}`, 14, 45);
    
    if (this.cliente.email) {
      doc.text(`Email: ${this.cliente.email}`, 14, 52);
    }
    
    if (this.cliente.telefono) {
      doc.text(`Teléfono: ${this.cliente.telefono}`, 14, 59);
    }
    
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 63, 196, 63);
  }

  // =============== TABLA DE FACTURAS ===============
  private agregarTablaFacturas(doc: jsPDF): void {
    const startY = this.cliente ? 68 : 40;
    
    const tableData = this.facturas.map((factura, index) => [
      (index + 1).toString(),
      `${factura.numero || 'N/A'}${factura.letra || ''}`,
      this.formatearFecha(factura.fecha),
      this.formatearMonto(factura.monto_total),
      factura.detalle || '—'
    ]);

    autoTable(doc, {
      head: [['#', 'Número Factura', 'Fecha', 'Monto', 'Detalle']],
      body: tableData,
      startY: startY,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 35 },
        2: { cellWidth: 30 },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 'auto' }
      },
      margin: { top: startY }
    });
  }

  private agregarTotal(doc: jsPDF): void {
    const total = this.facturas.reduce((sum, factura) => 
      sum + (Number(factura.monto_total) || 0), 0
    );

    const finalY = (doc as any).lastAutoTable?.finalY || 100;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    
    doc.setFillColor(240, 240, 240);
    doc.rect(14, finalY + 5, 182, 8, 'F');
    
    doc.text('TOTAL GENERAL:', 120, finalY + 10);
    doc.text(this.formatearMonto(total), 182, finalY + 10, { align: 'right' });
  }

  // =============== UTILIDADES ===============
  private generarNombreArchivo(): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    let baseName = 'facturas';
    
    if (this.cliente) {
      const clienteName = this.cliente.nombre.toLowerCase().replace(/\s+/g, '_');
      baseName = `facturas_${clienteName}`;
    } else if (this.titulo.includes('Factura')) {
      const numeroFactura = this.titulo.replace('Factura ', '').replace(/\s+/g, '_');
      baseName = `factura_${numeroFactura}`;
    } else if (this.titulo.includes('Todas')) {
      baseName = 'todas_las_facturas';
    }
    
    return `${baseName}_${timestamp}.pdf`;
  }

  private formatearMonto(monto: number | null | undefined): string {
    const montoNumero = Number(monto) || 0;
    return montoNumero.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  private formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) return 'N/A';
    
    try {
      const fechaObj = new Date(fecha);
      return fechaObj.toLocaleDateString('es-AR');
    } catch {
      return fecha.toString().slice(0, 10);
    }
  }
}