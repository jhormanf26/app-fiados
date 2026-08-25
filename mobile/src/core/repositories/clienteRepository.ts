import * as Crypto from 'expo-crypto';
import { obtenerBaseDatos } from '../database/db';
import { Cliente } from '../types/database';
import { motorSincronizacion } from '../sync/syncEngine';
import { tiendaRepository } from './tiendaRepository';

export class ClienteRepository {
  /**
   * Busca clientes por nombre, número de documento o teléfono
   */
  public async obtenerClientes(tiendaId: string, terminoBusqueda?: string): Promise<Cliente[]> {
    const db = obtenerBaseDatos();
    let query = `SELECT * FROM clientes WHERE tienda_id = ?`;
    const params: any[] = [tiendaId];

    if (terminoBusqueda && terminoBusqueda.trim().length > 0) {
      const termino = `%${terminoBusqueda.trim()}%`;
      query += ` AND (nombre LIKE ? OR numero_documento LIKE ? OR telefono LIKE ?)`;
      params.push(termino, termino, termino);
    }

    query += ` ORDER BY nombre ASC`;

    const rows = await db.getAllAsync<any>(query, params);
    return rows.map((row) => this.mapearFilaACliente(row));
  }

  /**
   * Obtiene un cliente por su ID
   */
  public async obtenerClientePorId(id: string): Promise<Cliente | null> {
    const db = obtenerBaseDatos();
    const row = await db.getFirstAsync<any>(`SELECT * FROM clientes WHERE id = ?`, [id]);
    if (!row) return null;
    return this.mapearFilaACliente(row);
  }

  /**
   * Calcula el límite de crédito efectivo (límite personalizado del cliente o límite por defecto de la tienda)
   */
  public async obtenerLimiteCreditoEfectivo(cliente: Cliente): Promise<number> {
    if (cliente.limiteCreditoPersonalizado !== undefined && cliente.limiteCreditoPersonalizado !== null) {
      return cliente.limiteCreditoPersonalizado;
    }
    const tienda = await tiendaRepository.obtenerTienda();
    return tienda?.limiteCreditoPredeterminado ?? 100000;
  }

  /**
   * Registra un nuevo cliente
   */
  public async crearCliente(
    tiendaId: string,
    datos: Omit<Cliente, 'id' | 'tiendaId' | 'saldoActual' | 'fechaCreacion' | 'fechaActualizacion'>
  ): Promise<Cliente> {
    const db = obtenerBaseDatos();
    const id = Crypto.randomUUID();
    const ahora = new Date().toISOString();

    const nuevoCliente: Cliente = {
      id,
      tiendaId,
      ...datos,
      saldoActual: 0,
      fechaCreacion: ahora,
      fechaActualizacion: ahora,
    };

    await db.runAsync(
      `INSERT INTO clientes (id, tienda_id, numero_documento, nombre, telefono, correo, notificaciones_autorizadas, correo_verificado, limite_credito_personalizado, saldo_actual, fecha_creacion, fecha_actualizacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nuevoCliente.id,
        nuevoCliente.tiendaId,
        nuevoCliente.numeroDocumento,
        nuevoCliente.nombre,
        nuevoCliente.telefono,
        nuevoCliente.correo ?? null,
        nuevoCliente.notificacionesAutorizadas ? 1 : 0,
        nuevoCliente.correoVerificado ? 1 : 0,
        nuevoCliente.limiteCreditoPersonalizado ?? null,
        0,
        ahora,
        ahora,
      ]
    );

    await motorSincronizacion.encolarItem('CLIENTE', 'CREAR', nuevoCliente);
    return nuevoCliente;
  }

  /**
   * Actualiza datos de un cliente
   */
  public async actualizarCliente(id: string, datos: Partial<Cliente>): Promise<Cliente | null> {
    const existente = await this.obtenerClientePorId(id);
    if (!existente) return null;

    const db = obtenerBaseDatos();
    const ahora = new Date().toISOString();

    const actualizado: Cliente = {
      ...existente,
      ...datos,
      fechaActualizacion: ahora,
    };

    await db.runAsync(
      `UPDATE clientes SET numero_documento = ?, nombre = ?, telefono = ?, correo = ?, notificaciones_autorizadas = ?, correo_verificado = ?, limite_credito_personalizado = ?, fecha_actualizacion = ? WHERE id = ?`,
      [
        actualizado.numeroDocumento,
        actualizado.nombre,
        actualizado.telefono,
        actualizado.correo ?? null,
        actualizado.notificacionesAutorizadas ? 1 : 0,
        actualizado.correoVerificado ? 1 : 0,
        actualizado.limiteCreditoPersonalizado ?? null,
        ahora,
        id,
      ]
    );

    await motorSincronizacion.encolarItem('CLIENTE', 'ACTUALIZAR', actualizado);
    return actualizado;
  }

  private mapearFilaACliente(row: any): Cliente {
    return {
      id: row.id,
      tiendaId: row.tienda_id,
      numeroDocumento: row.numero_documento,
      nombre: row.nombre,
      telefono: row.telefono,
      correo: row.correo ?? undefined,
      notificacionesAutorizadas: Boolean(row.notificaciones_autorizadas),
      correoVerificado: Boolean(row.correo_verificado),
      limiteCreditoPersonalizado: row.limite_credito_personalizado ?? undefined,
      saldoActual: row.saldo_actual,
      fechaCreacion: row.fecha_creacion,
      fechaActualizacion: row.fecha_actualizacion,
    };
  }
}

export const clienteRepository = new ClienteRepository();
