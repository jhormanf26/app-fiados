import { obtenerBaseDatos } from '../database/db';
import { Tienda } from '../types/database';
import { motorSincronizacion } from '../sync/syncEngine';
import { generarUUID } from '../utils/uuid';

export class TiendaRepository {
  /**
   * Obtiene la configuración de la tienda local
   */
  public async obtenerTienda(): Promise<Tienda | null> {
    const db = obtenerBaseDatos();
    const row = await db.getFirstAsync<any>(`SELECT * FROM tiendas LIMIT 1`);
    if (!row) return null;

    return {
      id: row.id,
      nombre: row.nombre,
      nombrePropietario: row.nombre_propietario,
      documentoPropietario: row.documento_propietario,
      telefono: row.telefono,
      correo: row.correo,
      direccion: row.direccion ?? undefined,
      ciudad: row.ciudad ?? undefined,
      limiteCreditoPredeterminado: row.limite_credito_predeterminado,
      fechaCreacion: row.fecha_creacion,
      fechaActualizacion: row.fecha_actualizacion,
      ultimaSincronizacion: row.ultima_sincronizacion ?? undefined,
    };
  }

  /**
   * Crea o actualiza los datos de la tienda
   */
  public async guardarTienda(datosTienda: Omit<Tienda, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<Tienda> {
    const db = obtenerBaseDatos();
    const existente = await this.obtenerTienda();
    const ahora = new Date().toISOString();

    if (existente) {
      const actualizada: Tienda = {
        ...existente,
        ...datosTienda,
        fechaActualizacion: ahora,
      };

      await db.runAsync(
        `UPDATE tiendas SET nombre = ?, nombre_propietario = ?, documento_propietario = ?, telefono = ?, correo = ?, direccion = ?, ciudad = ?, limite_credito_predeterminado = ?, fecha_actualizacion = ? WHERE id = ?`,
        [
          actualizada.nombre,
          actualizada.nombrePropietario,
          actualizada.documentoPropietario,
          actualizada.telefono,
          actualizada.correo,
          actualizada.direccion ?? null,
          actualizada.ciudad ?? null,
          actualizada.limiteCreditoPredeterminado,
          ahora,
          actualizada.id,
        ]
      );

      await motorSincronizacion.encolarItem('TIENDA', 'ACTUALIZAR', actualizada);
      return actualizada;
    } else {
      const nuevaTienda: Tienda = {
        id: generarUUID(),
        ...datosTienda,
        fechaCreacion: ahora,
        fechaActualizacion: ahora,
      };

      await db.runAsync(
        `INSERT INTO tiendas (id, nombre, nombre_propietario, documento_propietario, telefono, correo, direccion, ciudad, limite_credito_predeterminado, fecha_creacion, fecha_actualizacion)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nuevaTienda.id,
          nuevaTienda.nombre,
          nuevaTienda.nombrePropietario,
          nuevaTienda.documentoPropietario,
          nuevaTienda.telefono,
          nuevaTienda.correo,
          nuevaTienda.direccion ?? null,
          nuevaTienda.ciudad ?? null,
          nuevaTienda.limiteCreditoPredeterminado,
          ahora,
          ahora,
        ]
      );

      await motorSincronizacion.encolarItem('TIENDA', 'CREAR', nuevaTienda);
      return nuevaTienda;
    }
  }
}

export const tiendaRepository = new TiendaRepository();
