import { Component, Input } from '@angular/core';
import { Factura } from '../../services/facturas';

@Component({
  selector: 'app-factura-report',
  standalone: true,
  template: ''
})
export class FacturaReportComponent {
  @Input() facturas: Factura[] = [];
  @Input() titulo: string = 'Listado de Facturas';
  
  generarReporte(): void {
    if (this.facturas.length === 0) {
      alert('No hay facturas para generar el reporte');
      return;
    }

    const ventana = window.open('', '_blank', 'width=1024,height=768');
    if (!ventana) {
      alert('No se pudo abrir la ventana de reporte. Por favor, permite ventanas emergentes.');
      return;
    }
    
    ventana.document.write(this.generarHTML());
    ventana.document.close();
    ventana.focus();
  }

  private generarHTML(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          ${this.generarHead()}
        </head>
        <body>
          ${this.generarBody()}
        </body>
      </html>
    `;
  }

  private generarHead(): string {
    return `
      <title>${this.titulo}</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
      <style>
        ${this.generarEstilos()}
      </style>
    `;
  }

  private generarBody(): string {
    return `
      <div class="header-container">
        <div>
          <h1 class="report-title">${this.titulo}</h1>
          <div class="report-subtitle">
            Generado el ${new Date().toLocaleDateString('es-AR')} - ${this.facturas.length} factura(s)
          </div>
        </div>
      </div>

      <div class="button-container no-print">
        <button class="btn btn-primary" onclick="window.print()">
          <i class="bi bi-printer me-2"></i>Imprimir
        </button>
        <button class="btn btn-success" onclick="window.print()">
          <i class="bi bi-download me-2"></i>Descargar PDF
        </button>
      </div>

      <div class="table-responsive">
        <table class="table table-striped table-bordered align-middle">
          <thead class="table-light">
            <tr>
              <th>Número</th>
              <th>Letra</th>
              <th>Fecha</th>
              <th class="text-end">Monto</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            ${this.generarFilas()}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="3" class="text-end fw-bold">Total:</td>
              <td class="text-end fw-bold">${this.calcularTotal()}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <script>
        window.addEventListener('beforeprint', function() {
          document.querySelector('.button-container').style.display = 'none';
        });

        window.addEventListener('afterprint', function() {
          document.querySelector('.button-container').style.display = 'flex';
        });
      </script>
    `;
  }

  private generarFilas(): string {
    if (this.facturas.length === 0) {
      return '<tr><td colspan="5" class="text-center text-muted">No hay facturas para mostrar</td></tr>';
    }

    return this.facturas.map(factura => `
      <tr>
        <td>${factura.numero || 'N/A'}</td>
        <td>${factura.letra || 'N/A'}</td>
        <td>${this.formatearFecha(factura.fecha)}</td>
        <td class="text-end">${this.formatearMonto(factura.monto_total)}</td>
        <td>${factura.detalle || '—'}</td>
      </tr>
    `).join('');
  }

  private generarEstilos(): string {
    return `
      @media print {
        .no-print, .button-container { display: none !important; }
        @page { margin: 1cm; size: A4; }
        body { padding: 0 !important; font-size: 12px; }
        .header-container { margin-bottom: 1rem !important; padding-bottom: 0.5rem !important; }
        .report-title { font-size: 1.5rem !important; margin-bottom: 0.5rem !important; }
        table { font-size: 11px !important; }
        th, td { padding: 8px 6px !important; }
        .total-row { background-color: #f8f9fa !important; }
      }
      
      body { 
        padding: 24px; 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        background-color: #f8f9fa;
      }
      
      .button-container { 
        position: fixed; 
        top: 20px; 
        right: 20px; 
        z-index: 1000;
        display: flex; 
        gap: 15px;
        background: rgba(255, 255, 255, 0.95);
        padding: 15px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border: 1px solid #dee2e6;
      }
      
      .btn { 
        border-radius: 6px; 
        font-weight: 500; 
        padding: 10px 20px;
        transition: all 0.2s ease;
        border: 2px solid transparent;
      }
      
      .btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        border-color: currentColor;
      }
      
      .header-container { 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        margin-bottom: 2rem; 
        padding-bottom: 1rem; 
        border-bottom: 2px solid #e9ecef;
        background: white;
        padding: 2rem;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
      
      .report-title { 
        color: #2c3e50; 
        font-size: 1.8rem; 
        font-weight: 700; 
        margin: 0;
      }
      
      .report-subtitle { 
        color: #6c757d; 
        font-size: 1rem; 
        margin-top: 0.5rem;
      }
      
      .table-responsive { 
        border-radius: 8px; 
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        background: white;
      }
      
      .text-end { text-align: right; }
      
      .total-row { 
        background-color: #e3f2fd !important; 
        font-weight: 700; 
      }
      
      th { 
        background-color: #f8f9fa !important; 
        font-weight: 600; 
        color: #495057;
        border-bottom: 2px solid #dee2e6 !important;
      }
    `;
  }

  private formatearMonto(monto: number | null | undefined): string {
    const montoNumero = Number(monto) || 0;
    return montoNumero.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
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

  private calcularTotal(): string {
    const total = this.facturas.reduce((sum, factura) => 
      sum + (Number(factura.monto_total) || 0), 0
    );
    return this.formatearMonto(total);
  }
}