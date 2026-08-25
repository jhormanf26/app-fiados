/**
 * Modelos de Datos en Español para el Gestor Digital de Fiados
 * Interfaces TypeScript para la arquitectura Offline-First
 */

export type TipoMovimiento = 'FIADO' | 'PAGO' | 'AJUSTE' | 'ANULACION';
export type EstadoSincronizacion = 'PENDIENTE' | 'ENVIANDO' | 'SINCRONIZADO' | 'FALLIDO';
export type EntidadSincronizacion = 'TIENDA' | 'CLIENTE' | 'MOVIMIENTO';
export type AccionSincronizacion = 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR';

export interface Tienda {
  id: string; // UUID v4
  nombre: string;
  nombrePropietario: string;
  documentoPropietario: string;
  telefono: string;
  correo: string;
  direccion?: string;
  ciudad?: string;
  limiteCreditoPredeterminado: number;
  fechaCreacion: string;
  fechaActualizacion: string;
  ultimaSincronizacion?: string;
}

export interface Cliente {
  id: string; // UUID v4
  tiendaId: string;
  numeroDocumento: string;
  nombre: string;
  telefono: string;
  correo?: string;
  notificacionesAutorizadas: boolean;
  correoVerificado: boolean;
  limiteCreditoPersonalizado?: number;
  saldoActual: number; // Calculado localmente con cada movimiento
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface Movimiento {
  id: string; // UUID v4 generado localmente
  tiendaId: string;
  clienteId: string;
  tipo: TipoMovimiento;
  monto: number;
  descripcion?: string;
  saldoAnterior: number;
  nuevoSaldo: number;
  motivoAnulacion?: string;
  estadoSincronizacion: EstadoSincronizacion;
  fechaCreacion: string; // Formato ISO
  fechaSincronizacion?: string;
}

export interface ItemColaSincronizacion {
  id: string; // UUID v4
  tipoEntidad: EntidadSincronizacion;
  accion: AccionSincronizacion;
  payload: string; // JSON stringificado de la entidad
  estado: EstadoSincronizacion;
  numeroReintentos: number;
  mensajeError?: string;
  fechaCreacion: string;
}

export interface ResumenSincronizacion {
  pendientesCount: number;
  ultimaSincronizacion?: string;
  estaEnLinea: boolean;
}
