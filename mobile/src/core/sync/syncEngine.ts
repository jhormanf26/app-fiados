import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';
import { obtenerBaseDatos } from '../database/db';
import { ItemColaSincronizacion, ResumenSincronizacion, EntidadSincronizacion, AccionSincronizacion } from '../types/database';

type EscuchadorRed = (estaEnLinea: boolean) => void;

class MotorSincronizacion {
  private estaEnLinea: boolean = false;
  private escuchadores: Set<EscuchadorRed> = new Set();
  private estaSincronizando: boolean = false;

  constructor() {
    this.iniciarEscuchadorRed();
  }

  private iniciarEscuchadorRed() {
    NetInfo.addEventListener((state: NetInfoState) => {
      const enLinea = Boolean(state.isConnected && state.isInternetReachable !== false);
      if (this.estaEnLinea !== enLinea) {
        this.estaEnLinea = enLinea;
        this.notificarEscuchadores(enLinea);
        if (enLinea) {
          this.dispararSincronizacion();
        }
      }
    });
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
    const id = Crypto.randomUUID();
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
   * Dispara el proceso de sincronización con el backend
   */
  public async dispararSincronizacion(): Promise<void> {
    if (this.estaSincronizando || !this.estaEnLinea) {
      return;
    }

    this.estaSincronizando = true;
    try {
      const db = obtenerBaseDatos();
      const itemsPendientes = await db.getAllAsync<any>(
        `SELECT id, tipo_entidad as tipoEntidad, accion, payload, estado, numero_reintentos as numeroReintentos, mensaje_error as mensajeError, fecha_creacion as fechaCreacion FROM cola_sincronizacion WHERE estado = 'PENDIENTE' ORDER BY fecha_creacion ASC LIMIT 50`
      );

      if (itemsPendientes.length === 0) {
        this.estaSincronizando = false;
        return;
      }

      console.log(`[MotorSincronizacion] Se encontraron ${itemsPendientes.length} registros pendientes por sincronizar.`);

      // TODO: Conectar con el endpoint Spring Boot /api/v1/sync en Dokploy cuando el backend esté activo.

    } catch (error) {
      console.error('[MotorSincronizacion] Error al procesar la cola de sincronización:', error);
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
