import { obtenerBaseDatos } from '../database/db';
import { ItemColaSincronizacion } from '../types/database';
import { generarUUID } from '../utils/uuid';

export const syncRepository = {
  /**
   * Encola una mutación local en la tabla cola_sincronizacion (Outbox Pattern)
   */
  async encolarMutacion(
    entidad: 'TIENDA' | 'CLIENTE' | 'MOVIMIENTO',
    entidadId: string,
    operacion: 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR',
    payload: any
  ): Promise<void> {
    const db = obtenerBaseDatos();
    const id = generarUUID();
    const now = new Date().toISOString();

    const sql = `
      INSERT INTO cola_sincronizacion (id, tipo_entidad, accion, payload, estado, numero_reintentos, fecha_creacion)
      VALUES (?, ?, ?, ?, 'PENDIENTE', 0, ?);
    `;

    await db.runAsync(sql, [id, entidad, operacion, JSON.stringify(payload), now]);
  },

  /**
   * Obtiene todos los elementos pendientes en la cola de sincronización
   */
  async obtenerColaPendiente(): Promise<ItemColaSincronizacion[]> {
    const db = obtenerBaseDatos();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM cola_sincronizacion WHERE estado = 'PENDIENTE' ORDER BY fecha_creacion ASC;`
    );

    return rows.map((r: any) => ({
      id: r.id,
      tipoEntidad: r.tipo_entidad || r.entidad,
      accion: r.accion || r.operacion,
      payload: r.payload,
      estado: r.estado || 'PENDIENTE',
      numeroReintentos: r.numero_reintentos || 0,
      mensajeError: r.mensaje_error,
      fechaCreacion: r.fecha_creacion,
    }));
  },

  /**
   * Elimina de la cola los elementos que fueron sincronizados exitosamente por el servidor
   */
  async marcarComoSincronizados(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const db = obtenerBaseDatos();
    for (const id of ids) {
      await db.runAsync(`DELETE FROM cola_sincronizacion WHERE id = ?;`, [id]);
    }
  },

  /**
   * Incrementa el contador de intentos y registra el último error si el servidor rechaza el ítem
   */
  async registrarErrorItem(id: string, error: string): Promise<void> {
    const db = obtenerBaseDatos();
    await db.runAsync(
      `UPDATE cola_sincronizacion SET numero_reintentos = numero_reintentos + 1, mensaje_error = ?, estado = 'ERROR' WHERE id = ?;`,
      [error, id]
    );
  },

  /**
   * Retorna la cantidad de elementos actualmente en la cola de pendientes
   */
  async obtenerCantidadPendientes(): Promise<number> {
    const db = obtenerBaseDatos();
    const result = await db.getFirstAsync<{ total: number }>(
      `SELECT COUNT(*) as total FROM cola_sincronizacion WHERE estado = 'PENDIENTE';`
    );
    return result?.total ?? 0;
  },
};
