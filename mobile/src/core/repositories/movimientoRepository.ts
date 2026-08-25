import { obtenerBaseDatos } from '../database/db';
import { Movimiento, TipoMovimiento } from '../types/database';
import { clienteRepository } from './clienteRepository';
import { motorSincronizacion } from '../sync/syncEngine';
import { generarUUID } from '../utils/uuid';

export interface ResultadoFiado {
  movimiento: Movimiento;
  limiteSuperado: boolean;
  limiteEfectivo: number;
}

export class MovimientoRepository {
  /**
   * Registra un nuevo Fiado (Incremento de deuda)
   */
  public async agregarFiado(
    tiendaId: string,
    clienteId: string,
    monto: number,
    descripcion?: string
  ): Promise<ResultadoFiado> {
    if (monto <= 0) {
      throw new Error('El valor del fiado debe ser mayor a cero.');
    }

    const cliente = await clienteRepository.obtenerClientePorId(clienteId);
    if (!cliente) {
      throw new Error('Cliente no encontrado.');
    }

    const db = obtenerBaseDatos();
    const limiteEfectivo = await clienteRepository.obtenerLimiteCreditoEfectivo(cliente);
    const saldoAnterior = cliente.saldoActual;
    const nuevoSaldo = saldoAnterior + monto;
    const limiteSuperado = nuevoSaldo > limiteEfectivo;

    const id = generarUUID();
    const ahora = new Date().toISOString();

    const movimiento: Movimiento = {
      id,
      tiendaId,
      clienteId,
      tipo: 'FIADO',
      monto,
      descripcion,
      saldoAnterior,
      nuevoSaldo,
      estadoSincronizacion: 'PENDIENTE',
      fechaCreacion: ahora,
    };

    await db.withTransactionAsync(async () => {
      // 1. Insertar Movimiento
      await db.runAsync(
        `INSERT INTO movimientos (id, tienda_id, cliente_id, tipo, monto, descripcion, saldo_anterior, nuevo_saldo, estado_sincronizacion, fecha_creacion)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, tiendaId, clienteId, 'FIADO', monto, descripcion ?? null, saldoAnterior, nuevoSaldo, 'PENDIENTE', ahora]
      );

      // 2. Actualizar Saldo del Cliente
      await db.runAsync(
        `UPDATE clientes SET saldo_actual = ?, fecha_actualizacion = ? WHERE id = ?`,
        [nuevoSaldo, ahora, clienteId]
      );
    });

    await motorSincronizacion.encolarItem('MOVIMIENTO', 'CREAR', movimiento);

    return {
      movimiento,
      limiteSuperado,
      limiteEfectivo,
    };
  }

  /**
   * Registra un Pago o Abono (Reducción de deuda)
   */
  public async agregarPago(
    tiendaId: string,
    clienteId: string,
    monto: number,
    descripcion?: string
  ): Promise<Movimiento> {
    if (monto <= 0) {
      throw new Error('El valor del pago debe ser mayor a cero.');
    }

    const cliente = await clienteRepository.obtenerClientePorId(clienteId);
    if (!cliente) {
      throw new Error('Cliente no encontrado.');
    }

    const db = obtenerBaseDatos();
    const saldoAnterior = cliente.saldoActual;
    const nuevoSaldo = Math.max(0, saldoAnterior - monto);
    const id = generarUUID();
    const ahora = new Date().toISOString();

    const movimiento: Movimiento = {
      id,
      tiendaId,
      clienteId,
      tipo: 'PAGO',
      monto,
      descripcion,
      saldoAnterior,
      nuevoSaldo,
      estadoSincronizacion: 'PENDIENTE',
      fechaCreacion: ahora,
    };

    await db.withTransactionAsync(async () => {
      // 1. Insertar Movimiento
      await db.runAsync(
        `INSERT INTO movimientos (id, tienda_id, cliente_id, tipo, monto, descripcion, saldo_anterior, nuevo_saldo, estado_sincronizacion, fecha_creacion)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, tiendaId, clienteId, 'PAGO', monto, descripcion ?? null, saldoAnterior, nuevoSaldo, 'PENDIENTE', ahora]
      );

      // 2. Actualizar Saldo del Cliente
      await db.runAsync(
        `UPDATE clientes SET saldo_actual = ?, fecha_actualizacion = ? WHERE id = ?`,
        [nuevoSaldo, ahora, clienteId]
      );
    });

    await motorSincronizacion.encolarItem('MOVIMIENTO', 'CREAR', movimiento);

    return movimiento;
  }

  /**
   * Anulación suave de movimiento con motivo de auditoría
   */
  public async anularMovimiento(movimientoId: string, motivo: string): Promise<Movimiento> {
    if (!motivo || motivo.trim().length === 0) {
      throw new Error('Debe proporcionar un motivo para la anulación.');
    }

    const db = obtenerBaseDatos();
    const row = await db.getFirstAsync<any>(`SELECT * FROM movimientos WHERE id = ?`, [movimientoId]);
    if (!row) {
      throw new Error('Movimiento no encontrado.');
    }

    if (row.tipo === 'ANULACION') {
      throw new Error('Este movimiento ya ha sido anulado anteriormente.');
    }

    const cliente = await clienteRepository.obtenerClientePorId(row.cliente_id);
    if (!cliente) {
      throw new Error('Cliente asociado no encontrado.');
    }

    const ahora = new Date().toISOString();
    const tipoOriginal: TipoMovimiento = row.tipo;
    const monto: number = row.monto;
    const saldoAnterior = cliente.saldoActual;

    // Revertir el saldo según el tipo original
    let nuevoSaldo = saldoAnterior;
    if (tipoOriginal === 'FIADO') {
      nuevoSaldo = Math.max(0, saldoAnterior - monto);
    } else if (tipoOriginal === 'PAGO') {
      nuevoSaldo = saldoAnterior + monto;
    }

    const movimientoAnulado: Movimiento = {
      id: row.id,
      tiendaId: row.cliente_id,
      clienteId: row.cliente_id,
      tipo: 'ANULACION',
      monto: row.monto,
      descripcion: row.descripcion ?? undefined,
      saldoAnterior,
      nuevoSaldo,
      motivoAnulacion: motivo,
      estadoSincronizacion: 'PENDIENTE',
      fechaCreacion: row.fecha_creacion,
    };

    await db.withTransactionAsync(async () => {
      // 1. Marcar como ANULACION
      await db.runAsync(
        `UPDATE movimientos SET tipo = 'ANULACION', motivo_anulacion = ?, saldo_anterior = ?, nuevo_saldo = ?, estado_sincronizacion = 'PENDIENTE' WHERE id = ?`,
        [motivo, saldoAnterior, nuevoSaldo, movimientoId]
      );

      // 2. Revertir saldo del cliente
      await db.runAsync(
        `UPDATE clientes SET saldo_actual = ?, fecha_actualizacion = ? WHERE id = ?`,
        [nuevoSaldo, ahora, row.cliente_id]
      );
    });

    await motorSincronizacion.encolarItem('MOVIMIENTO', 'ACTUALIZAR', movimientoAnulado);

    return movimientoAnulado;
  }

  /**
   * Obtiene el historial cronológico de movimientos de un cliente
   */
  public async obtenerHistorialCliente(clienteId: string): Promise<Movimiento[]> {
    const db = obtenerBaseDatos();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM movimientos WHERE cliente_id = ? ORDER BY fecha_creacion DESC`,
      [clienteId]
    );

    return rows.map((row) => ({
      id: row.id,
      tiendaId: row.tienda_id,
      clienteId: row.cliente_id,
      tipo: row.tipo as TipoMovimiento,
      monto: row.monto,
      descripcion: row.descripcion ?? undefined,
      saldoAnterior: row.saldo_anterior,
      nuevoSaldo: row.nuevo_saldo,
      motivoAnulacion: row.motivo_anulacion ?? undefined,
      estadoSincronizacion: row.estado_sincronizacion,
      fechaCreacion: row.fecha_creacion,
      fechaSincronizacion: row.fecha_sincronizacion ?? undefined,
    }));
  }

  /**
   * Obtiene el resumen de cartera (Total Fiado acumulado vs Total Recuperado en Pagos)
   */
  public async obtenerResumenCartera(tiendaId: string): Promise<{ totalFiado: number; totalRecuperado: number }> {
    const db = obtenerBaseDatos();
    const resFiado = await db.getFirstAsync<{ total: number }>(
      `SELECT SUM(monto) as total FROM movimientos WHERE tienda_id = ? AND tipo = 'FIADO'`,
      [tiendaId]
    );
    const resPago = await db.getFirstAsync<{ total: number }>(
      `SELECT SUM(monto) as total FROM movimientos WHERE tienda_id = ? AND tipo = 'PAGO'`,
      [tiendaId]
    );

    const clientes = await clienteRepository.obtenerClientes(tiendaId);
    const sumaSaldosActuales = clientes.reduce((acc, c) => acc + (c.saldoActual || 0), 0);

    const fiadoMovimientos = resFiado?.total ?? 0;
    const pagoMovimientos = resPago?.total ?? 0;

    const totalFiadoCalculado = Math.max(fiadoMovimientos, pagoMovimientos + sumaSaldosActuales);

    return {
      totalFiado: totalFiadoCalculado,
      totalRecuperado: pagoMovimientos,
    };
  }
}

export const movimientoRepository = new MovimientoRepository();
