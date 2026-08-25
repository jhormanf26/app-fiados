import { obtenerBaseDatos } from '../database/db';
import { ItemColaSincronizacion, ResumenSincronizacion, EntidadSincronizacion, AccionSincronizacion } from '../types/database';
import { generarUUID } from '../utils/uuid';

export const CONFIG_SYNC = {
  BACKEND_URL: 'http://localhost:8080/api/v1',
};

type EscuchadorRed = (estaEnLinea: boolean) => void;

class MotorSincronizacion {
  private estaEnLinea: boolean = false;
  private escuchadores: Set<EscuchadorRed> = new Set();
  private estaSincronizando: boolean = false;

  constructor() {
    this.iniciarEscuchadorRed();
  }

  private iniciarEscuchadorRed() {
    try {
      const NetInfo = require('@react-native-community/netinfo').default;
      NetInfo.addEventListener((state: any) => {
        const enLinea = Boolean(state.isConnected && state.isInternetReachable !== false);
        if (this.estaEnLinea !== enLinea) {
          this.estaEnLinea = enLinea;
          this.notificarEscuchadores(enLinea);
          if (enLinea) {
            this.dispararSincronizacion();
          }
        }
      });
    } catch {
      this.estaEnLinea = true;
    }
  }

  public suscribir(escuchador: EscuchadorRed): () => void {
    this.escuchadores.add(escuchador);
    escuchador(this.estaEnLinea);
    return () => this.escuchadores.delete(escuchador);
  }

  private notificarEscuchadores(estaEnLinea: boolean) {
    this.escuchadores.forEach((escuchador) => escuchador(estaEnLinea));
  }

  /**
   * Encola una mutación en la tabla local cola_sincronizacion
   */
  public async encolarItem(
    tipoEntidad: EntidadSincronizacion,
    accion: AccionSincronizacion,
    payload: object
  ): Promise<string> {
    const db = obtenerBaseDatos();
    const id = generarUUID();
    const fechaCreacion = new Date().toISOString();
    const payloadStr = JSON.stringify(payload);

    await db.runAsync(
      `INSERT INTO cola_sincronizacion (id, tipo_entidad, accion, payload, estado, numero_reintentos, fecha_creacion)
       VALUES (?, ?, ?, ?, 'PENDIENTE', 0, ?)`,
      [id, tipoEntidad, accion, payloadStr, fechaCreacion]
    );

    if (this.estaEnLinea) {
      this.dispararSincronizacion();
    }

    return id;
  }

  /**
   * Dispara el proceso de sincronización con el backend Spring Boot
   */
  public async dispararSincronizacion(): Promise<{ exito: boolean; procesados: number; mensaje: string }> {
    if (this.estaSincronizando) {
      return { exito: false, procesados: 0, mensaje: 'Sincronización en curso...' };
    }

    this.estaSincronizando = true;
    try {
      const db = obtenerBaseDatos();
      const itemsPendientes = await db.getAllAsync<any>(
        `SELECT id, tipo_entidad as tipoEntidad, accion, payload, estado, numero_reintentos as numeroReintentos, mensaje_error as mensajeError, fecha_creacion as fechaCreacion FROM cola_sincronizacion WHERE estado = 'PENDIENTE' ORDER BY fecha_creacion ASC LIMIT 50`
      );

      if (itemsPendientes.length === 0) {
        this.estaSincronizando = false;
        return { exito: true, procesados: 0, mensaje: 'La aplicación ya está al día.' };
      }

      console.log(`[MotorSincronizacion] Enviando ${itemsPendientes.length} registros al backend Spring Boot...`);

      const mutaciones = itemsPendientes.map((item) => {
        let payloadObj = {};
        try {
          payloadObj = typeof item.payload === 'string' ? JSON.parse(item.payload) : item.payload;
        } catch {
          payloadObj = item.payload;
        }

        return {
          id: item.id,
          tipoEntidad: item.tipoEntidad,
          operacion: item.accion,
          payload: payloadObj,
          fechaCreacion: item.fechaCreacion,
        };
      });

      const response = await fetch(`${CONFIG_SYNC.BACKEND_URL}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tiendaId: 'tienda-local',
          mutaciones,
        }),
      });

      if (!response.ok) {
        throw new Error(`El servidor backend respondió con código HTTP ${response.status}`);
      }

      const data = await response.json();
      let procesadosExitosos = 0;

      if (data.resultados && Array.isArray(data.resultados)) {
        for (const res of data.resultados) {
          if (res.estado === 'SINCRONIZADO') {
            await db.runAsync(`DELETE FROM cola_sincronizacion WHERE id = ?`, [res.id]);
            procesadosExitosos++;
          } else {
            await db.runAsync(
              `UPDATE cola_sincronizacion SET estado = 'ERROR', mensaje_error = ?, numero_reintentos = numero_reintentos + 1 WHERE id = ?`,
              [res.mensajeError || 'Error en servidor', res.id]
            );
          }
        }
      }

      const ahoraIso = new Date().toISOString();
      await db.runAsync(`UPDATE tiendas SET ultima_sincronizacion = ?`, [ahoraIso]);

      return {
        exito: true,
        procesados: procesadosExitosos,
        mensaje: `Sincronización exitosa: ${procesadosExitosos} registros guardados en la nube.`,
      };
    } catch (error: any) {
      console.warn('[MotorSincronizacion] Modo Offline: No se pudo conectar con el backend:', error.message || error);
      return {
        exito: false,
        procesados: 0,
        mensaje: 'Modo Offline: Operaciones guardadas localmente. Se sincronizarán al conectar con el backend.',
      };
    } finally {
      this.estaSincronizando = false;
    }
  }

  /**
   * Obtiene el resumen del estado de sincronización
   */
  public async obtenerResumen(): Promise<ResumenSincronizacion> {
    const db = obtenerBaseDatos();
    const resultado = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM cola_sincronizacion WHERE estado = 'PENDIENTE'`
    );

    return {
      pendientesCount: resultado?.count ?? 0,
      estaEnLinea: this.estaEnLinea,
    };
  }
}

export const motorSincronizacion = new MotorSincronizacion();
