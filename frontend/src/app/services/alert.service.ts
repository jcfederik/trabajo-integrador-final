import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon, SweetAlertResult, SweetAlertOptions } from 'sweetalert2';

// ====== INTERFACES ======
export type AlertOptions = {
  swal?: SweetAlertOptions;
  customProperty?: string;
};

@Injectable({ providedIn: 'root' })
export class AlertService {
  
  // ====== MÉTODOS GENÉRICOS ======
  showAlert(title: string, text: string = '', icon: SweetAlertIcon = 'info'): Promise<SweetAlertResult> {
    return Swal.fire({
      title,
      text,
      icon,
      confirmButtonText: 'Aceptar',
      timer: icon === 'success' ? 2000 : undefined
    });
  }

  showConfirm(options: AlertOptions): Promise<SweetAlertResult> {
    const defaultOptions: SweetAlertOptions = {
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true
    };

    const finalOptions = {
      ...defaultOptions,
      ...options.swal
    } as SweetAlertOptions;

    return Swal.fire(finalOptions);
  }

  showSuccess(title: string, text: string = ''): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      toast: true,               
      position: 'top-end',       
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
      customClass: {
        popup: 'swal-toast-offset swal-zindex'
      }
    });
  }

  showError(title: string, text: string = ''): Promise<SweetAlertResult> {
    return Swal.fire({
      title,
      text,
      icon: 'error',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#d33'
    });
  }

  showLoading(title: string = 'Procesando...'): void {
    Swal.fire({
      title,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  closeLoading(): void {
    Swal.close();
  }

  showToast(title: string, icon: SweetAlertIcon = 'success', timer: number = 3000): void {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

    Toast.fire({ icon, title });
  }

  // ====== MÉTODOS ESPECÍFICOS PARA CRUD ======
  async confirmDelete(entityName: string, itemName?: string): Promise<boolean> {
    const text = itemName 
      ? `¿Estás seguro de eliminar "${itemName}"?` 
      : `¿Estás seguro de eliminar este ${entityName}?`;

    const result = await this.showConfirm({
      swal: {
        title: `Eliminar ${entityName}`,
        text,
        icon: 'warning',
        confirmButtonText: 'Sí, eliminar'
      }
    });

    return result.isConfirmed;
  }

  showCreateSuccess(entityName: string, itemName?: string): void {
    const message = itemName 
      ? `"${itemName}" creado exitosamente` 
      : `${entityName} creado exitosamente`;
    
    this.showToast(message, 'success');
  }

  showUpdateSuccess(entityName: string, itemName?: string): void {
    const message = itemName 
      ? `"${itemName}" actualizado exitosamente` 
      : `${entityName} actualizado exitosamente`;
    
    this.showToast(message, 'success');
  }

  showDeleteSuccess(entityName: string, itemName?: string): void {
    const message = itemName 
      ? `"${itemName}" eliminado exitosamente` 
      : `${entityName} eliminado exitosamente`;
    
    this.showToast(message, 'success');
  }

  showValidationError(fieldName: string): void {
    this.showError('Error de validación', `El campo "${fieldName}" es obligatorio`);
  }

  showGenericError(message: string = 'Ocurrió un error inesperado'): void {
    this.showError('Error', message);
  }

  // ====== MÉTODOS ESPECÍFICOS POR COMPONENTE ======
  async confirmDeleteCliente(clienteNombre: string): Promise<boolean> {
    return this.confirmDelete('cliente', clienteNombre);
  }

  showClienteCreado(clienteNombre: string): void {
    this.showCreateSuccess('Cliente', clienteNombre);
  }

  showClienteActualizado(clienteNombre: string): void {
    this.showUpdateSuccess('Cliente', clienteNombre);
  }

  showClienteEliminado(clienteNombre: string): void {
    this.showDeleteSuccess('Cliente', clienteNombre);
  }

  async confirmDeleteEquipo(equipoDescripcion: string): Promise<boolean> {
    return this.confirmDelete('equipo', equipoDescripcion);
  }

  showEquipoCreado(): void {
    this.showCreateSuccess('Equipo');
  }

  showEquipoActualizado(): void {
    this.showUpdateSuccess('Equipo');
  }

  showEquipoEliminado(): void {
    this.showDeleteSuccess('Equipo');
  }

  async confirmDeleteFactura(numeroFactura: string): Promise<boolean> {
    return this.confirmDelete('factura', `Factura ${numeroFactura}`);
  }

  showFacturaCreada(): void {
    this.showCreateSuccess('Factura');
  }

  showFacturaActualizada(): void {
    this.showUpdateSuccess('Factura');
  }

  showFacturaEliminada(): void {
    this.showDeleteSuccess('Factura');
  }

  async confirmDeletePresupuesto(id: number): Promise<boolean> {
    return this.confirmDelete('presupuesto', `Presupuesto #${id}`);
  }

  showPresupuestoCreado(): void {
    this.showCreateSuccess('Presupuesto');
  }

  showPresupuestoActualizado(): void {
    this.showUpdateSuccess('Presupuesto');
  }

  showPresupuestoEliminado(): void {
    this.showDeleteSuccess('Presupuesto');
  }

  async confirmDeleteReparacion(descripcion: string): Promise<boolean> {
    return this.confirmDelete('reparación', descripcion);
  }

  showReparacionCreada(): void {
    this.showCreateSuccess('Reparación');
  }

  showReparacionActualizada(): void {
    this.showUpdateSuccess('Reparación');
  }

  showReparacionEliminada(): void {
    this.showDeleteSuccess('Reparación');
  }

  async confirmDeleteRepuesto(repuestoNombre: string): Promise<boolean> {
    return this.confirmDelete('repuesto', repuestoNombre);
  }

  showRepuestoCreado(repuestoNombre: string): void {
    this.showCreateSuccess('Repuesto', repuestoNombre);
  }

  showRepuestoActualizado(repuestoNombre: string): void {
    this.showUpdateSuccess('Repuesto', repuestoNombre);
  }

  showRepuestoEliminado(repuestoNombre: string): void {
    this.showDeleteSuccess('Repuesto', repuestoNombre);
  }

  async confirmDeleteProveedor(razonSocial: string): Promise<boolean> {
    return this.confirmDelete('proveedor', razonSocial);
  }

  showProveedorCreado(razonSocial: string): void {
    this.showCreateSuccess('Proveedor', razonSocial);
  }

  showProveedorActualizado(razonSocial: string): void {
    this.showUpdateSuccess('Proveedor', razonSocial);
  }

  showProveedorEliminado(razonSocial: string): void {
    this.showDeleteSuccess('Proveedor', razonSocial);
  }

  async confirmDeleteMedioCobro(medioNombre: string): Promise<boolean> {
    return this.confirmDelete('medio de cobro', medioNombre);
  }

  showMedioCobroCreado(medioNombre: string): void {
    this.showCreateSuccess('Medio de cobro', medioNombre);
  }

  showMedioCobroActualizado(medioNombre: string): void {
    this.showUpdateSuccess('Medio de cobro', medioNombre);
  }

  showMedioCobroEliminado(medioNombre: string): void {
    this.showDeleteSuccess('Medio de cobro', medioNombre);
  }

  showExportSuccess(archivoNombre: string): void {
    this.showToast(`Reporte "${archivoNombre}" generado exitosamente`, 'success');
  }

  showExportError(): void {
    this.showError('Error al exportar', 'No se pudo generar el reporte');
  }

  showReportLoading(): void {
    this.showLoading('Generando reporte...');
  }

  showReportSuccess(): void {
    this.closeLoading();
    this.showToast('Reporte generado exitosamente', 'success');
  }

  showReportError(): void {
    this.closeLoading();
    this.showError('Error', 'No se pudo generar el reporte');
  }

  // ====== MÉTODOS DE VALIDACIÓN ESPECÍFICOS ======
  showRequiredFieldError(fieldName: string): void {
    this.showValidationError(fieldName);
  }

  showInvalidNumberError(fieldName: string): void {
    this.showError('Error de validación', `El campo "${fieldName}" debe ser un número válido`);
  }

  showInvalidEmailError(): void {
    this.showError('Error de validación', 'El email ingresado no es válido');
  }

  // ====== MÉTODOS DE NOTIFICACIÓN RÁPIDA ======
  success(message: string): void {
    this.showToast(message, 'success');
  }

  error(message: string): void {
    this.showToast(message, 'error', 5000);
  }

  warning(message: string): void {
    this.showToast(message, 'warning');
  }

  info(message: string): void {
    this.showToast(message, 'info');
  }
}