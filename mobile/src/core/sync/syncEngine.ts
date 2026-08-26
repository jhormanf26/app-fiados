import { Platform } from 'react-native';
import { obtenerBaseDatos } from '../database/db';
import { ItemColaSincronizacion, ResumenSincronizacion, EntidadSincronizacion, AccionSincronizacion } from '../types/database';
import { generarUUID } from '../utils/uuid';

export const CONFIG_SYNC = {
  BACKEND_URL: 'https://back-fiaya.desaroollo.site/api/v1',
};

type EscuchadorRed = (estaEnLinea: boolean) => void;

class MotorSincronizacion {
  private estaEnLinea: boolean = typeof navigator !== 'undefined' ? (navigator.onLine ?? true) : true;
  private escuchadores: Set<EscuchadorRed> = new Set();
  private estaSincronizando: boolean = false;

  constructor() {
    this.iniciarEscuchadorRed();
  }

  private iniciarEscuchadorRed() {
    try {
      const NetInfo = require('@react-native-community/netinfo').default;

      // Verificación proactiva inicial del estado de red
      NetInfo.fetch().then((state: any) => {
        const enLinea = Boolean(state.isConnected && state.isInternetReachable !== false);
        this.estaEnLinea = enLinea;
        this.notificarEscuchadores(enLinea);
        console.log(`[MotorSincronizacion] 🌐 Estado inicial de red detectado: ${enLinea ? 'ONLINE ✅' : 'OFFLINE ⚠️'}`);
      }).catch((err: any) => {
        console.warn('[MotorSincronizacion] Error al obtener estado inicial de NetInfo:', err);
      });

      NetInfo.addEventListener((state: any) => {
        const enLinea = Boolean(state.isConnected && state.isInternetReachable !== false);
        if (this.estaEnLinea !== enLinea) {
          this.estaEnLinea = enLinea;
          console.log(`[MotorSincronizacion] 🌐 Cambio en el estado de red: ${enLinea ? 'ONLINE ✅' : 'OFFLINE ⚠️'}`);
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
    const payloadObj = payload as any;
    const id = payloadObj && payloadObj.id ? payloadObj.id : generarUUID();
    const fechaCreacion = new Date().toISOString();
    const payloadStr = JSON.stringify(payload);

    console.log(`[MotorSincronizacion] ➕ Encolando mutación: [${tipoEntidad}] [${accion}] ID: ${id}`);
    console.log(`[MotorSincronizacion] 📦 Payload encolado: ${payloadStr}`);

    await db.runAsync(
      `INSERT OR REPLACE INTO cola_sincronizacion (id, tipo_entidad, accion, payload, estado, numero_reintentos, fecha_creacion)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, tipoEntidad, accion, payloadStr, 'PENDIENTE', 0, fechaCreacion]
    );

    // Intentar transmitir de inmediato la mutación al backend
    this.dispararSincronizacion();

    return id;
  }

  /**
   * Asegura que todos los datos existentes en la base de datos local SQLite (tiendas, clientes y movimientos)
   * que aún no tengan registro en la cola sean auto-encolados para ser sincronizados con MySQL en Dokploy.
   */
  public async asegurarRegistrosEnCola(forzarTodo: boolean = false): Promise<void> {
    try {
      const db = obtenerBaseDatos();

      // 1. Asegurar Tienda
      const tienda = await db.getFirstAsync<any>(`SELECT * FROM tiendas LIMIT 1`);
      if (tienda) {
        const existeTienda = forzarTodo ? null : await db.getFirstAsync<any>(`SELECT id FROM cola_sincronizacion WHERE id = ? AND estado = 'PENDIENTE'`, [tienda.id]);
        if (!existeTienda) {
          const payload = {
            id: tienda.id,
            nombre: tienda.nombre,
            nombrePropietario: tienda.nombre_propietario,
            documentoPropietario: tienda.documento_propietario,
            telefono: tienda.telefono,
            correo: tienda.correo,
            direccion: tienda.direccion,
            ciudad: tienda.ciudad,
            limiteCreditoPredeterminado: tienda.limite_credito_predeterminado,
          };
          await db.runAsync(
            `INSERT OR REPLACE INTO cola_sincronizacion (id, tipo_entidad, accion, payload, estado, numero_reintentos, fecha_creacion)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [tienda.id, 'TIENDA', 'CREAR', JSON.stringify(payload), 'PENDIENTE', 0, new Date().toISOString()]
          );
        }
      }

      // 2. Asegurar Clientes
      const clientes = await db.getAllAsync<any>(`SELECT * FROM clientes`);
      for (const c of clientes) {
        const existeCliente = forzarTodo ? null : await db.getFirstAsync<any>(`SELECT id FROM cola_sincronizacion WHERE id = ? AND estado = 'PENDIENTE'`, [c.id]);
        if (!existeCliente) {
          const payload = {
            id: c.id,
            tiendaId: c.tienda_id,
            numeroDocumento: c.numero_documento,
            nombre: c.nombre,
            telefono: c.telefono,
            correo: c.correo,
            notificacionesAutorizadas: Boolean(c.notificaciones_autorizadas),
            correoVerificado: Boolean(c.correo_verificado),
            limiteCreditoPersonalizado: c.limite_credito_personalizado,
            saldoActual: c.saldo_actual,
          };
          await db.runAsync(
            `INSERT OR REPLACE INTO cola_sincronizacion (id, tipo_entidad, accion, payload, estado, numero_reintentos, fecha_creacion)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [c.id, 'CLIENTE', 'CREAR', JSON.stringify(payload), 'PENDIENTE', 0, new Date().toISOString()]
          );
        }
      }

      // 3. Asegurar Movimientos (Filtrar por estado_sincronizacion = 'PENDIENTE' o forzarTodo)
      const queryMovs = forzarTodo
        ? `SELECT * FROM movimientos`
        : `SELECT * FROM movimientos WHERE estado_sincronizacion = 'PENDIENTE' OR estado_sincronizacion IS NULL`;
      const movimientos = await db.getAllAsync<any>(queryMovs);

      for (const m of movimientos) {
        const existeMov = forzarTodo ? null : await db.getFirstAsync<any>(`SELECT id FROM cola_sincronizacion WHERE id = ? AND estado = 'PENDIENTE'`, [m.id]);
        if (!existeMov) {
          const payload = {
            id: m.id,
            tiendaId: m.tienda_id,
            clienteId: m.cliente_id,
            tipo: m.tipo,
            monto: m.monto,
            descripcion: m.descripcion,
            saldoAnterior: m.saldo_anterior,
            nuevoSaldo: m.nuevo_saldo,
            motivoAnulacion: m.motivo_anulacion,
          };
          await db.runAsync(
            `INSERT OR REPLACE INTO cola_sincronizacion (id, tipo_entidad, accion, payload, estado, numero_reintentos, fecha_creacion)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [m.id, 'MOVIMIENTO', 'CREAR', JSON.stringify(payload), 'PENDIENTE', 0, new Date().toISOString()]
          );
        }
      }
    } catch (e) {
      console.warn('[MotorSincronizacion] Error al verificar auto-encolado:', e);
    }
  }

  /**
   * Fuerza la resincronización total vaciando la cola local y enviando todas las tiendas, clientes y movimientos existentes a MySQL en Dokploy
   */
  public async forzarResincronizacionTotal(): Promise<{ exito: boolean; procesados: number; mensaje: string }> {
    try {
      const db = obtenerBaseDatos();
      await db.runAsync(`DELETE FROM cola_sincronizacion`);
      await this.asegurarRegistrosEnCola(true);
    } catch (e) {
      console.warn('Error al reiniciar cola:', e);
    }
    return await this.dispararSincronizacion();
  }

  /**
   * Dispara el proceso de sincronización con el backend Spring Boot
   */
  public async dispararSincronizacion(): Promise<{ exito: boolean; procesados: number; mensaje: string }> {
    console.log(`[MotorSincronizacion] ⚡ dispararSincronizacion invocado. Estado actual sincronizando: ${this.estaSincronizando}`);
    if (this.estaSincronizando) {
      console.log(`[MotorSincronizacion] ⏳ Sincronización ya en curso, omitiendo ejecución simultánea.`);
      return { exito: false, procesados: 0, mensaje: 'Sincronización en curso...' };
    }

    this.estaSincronizando = true;
    try {
      await this.asegurarRegistrosEnCola(false);

      const db = obtenerBaseDatos();
      let itemsPendientes = await db.getAllAsync<any>(
        `SELECT id, tipo_entidad as tipoEntidad, accion, payload, estado, numero_reintentos as numeroReintentos, mensaje_error as mensajeError, fecha_creacion as fechaCreacion FROM cola_sincronizacion WHERE estado = 'PENDIENTE' ORDER BY fecha_creacion ASC LIMIT 50`
      );

      if (itemsPendientes.length === 0) {
        await this.asegurarRegistrosEnCola(true);
        itemsPendientes = await db.getAllAsync<any>(
          `SELECT id, tipo_entidad as tipoEntidad, accion, payload, estado, numero_reintentos as numeroReintentos, mensaje_error as mensajeError, fecha_creacion as fechaCreacion FROM cola_sincronizacion WHERE estado = 'PENDIENTE' ORDER BY fecha_creacion ASC LIMIT 50`
        );
      }

      if (itemsPendientes.length === 0) {
        console.log(`[MotorSincronizacion] ℹ️ No hay registros pendientes por enviar. Aplicación al día.`);
        this.estaSincronizando = false;
        return { exito: true, procesados: 0, mensaje: 'La aplicación ya está al día.' };
      }

      console.log(`[MotorSincronizacion] 🚀 Iniciando envío de batch. Registros pendientes en cola: ${itemsPendientes.length}`);

      const mutaciones = itemsPendientes.map((item) => {
        let payloadObj = {};
        try {
          payloadObj = typeof item.payload === 'string' ? JSON.parse(item.payload) : item.payload;
        } catch {
          payloadObj = item.payload;
        }

        return {
          id: item.id,
          tipoEntidad: item.tipoEntidad || item.tipo_entidad,
          operacion: item.accion,
          payload: payloadObj,
          fechaCreacion: item.fechaCreacion || item.fecha_creacion,
        };
      });

      const bodyJSON = JSON.stringify({
        tiendaId: 'tienda-local',
        mutaciones,
      });

      console.log(`[MotorSincronizacion] 📤 Enviando POST ${CONFIG_SYNC.BACKEND_URL}/sync`);
      console.log(`[MotorSincronizacion] 📄 Body Payload: ${bodyJSON}`);

      const response = await fetch(`${CONFIG_SYNC.BACKEND_URL}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: bodyJSON,
      });

      console.log(`[MotorSincronizacion] 📥 Respuesta recibida HTTP STATUS: ${response.status}`);

      if (!response.ok) {
        throw new Error(`El servidor backend respondió con código HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(`[MotorSincronizacion] 📊 Respuesta Servidor Data: ${JSON.stringify(data)}`);

      let procesadosExitosos = 0;
      const ahoraIso = new Date().toISOString();

      if (data.resultados && Array.isArray(data.resultados)) {
        for (const res of data.resultados) {
          if (res.estado === 'SINCRONIZADO') {
            // 1. Eliminar de cola local
            await db.runAsync(`DELETE FROM cola_sincronizacion WHERE id = ?`, [res.id]);

            // 2. Actualizar estado_sincronizacion en tabla movimientos en SQLite si corresponde
            await db.runAsync(
              `UPDATE movimientos SET estado_sincronizacion = 'SINCRONIZADO', fecha_sincronizacion = ? WHERE id = ?`,
              [ahoraIso, res.id]
            );

            // 3. Buscar si el id corresponde al payload de algún movimiento en la cola
            const itemOriginal = itemsPendientes.find((i) => i.id === res.id);
            if (itemOriginal && itemOriginal.tipoEntidad === 'MOVIMIENTO') {
              try {
                const payloadObj = typeof itemOriginal.payload === 'string' ? JSON.parse(itemOriginal.payload) : itemOriginal.payload;
                if (payloadObj && payloadObj.id) {
                  await db.runAsync(
                    `UPDATE movimientos SET estado_sincronizacion = 'SINCRONIZADO', fecha_sincronizacion = ? WHERE id = ?`,
                    [ahoraIso, payloadObj.id]
                  );
                }
              } catch (e) {
                // ignorar si no hay id interno
              }
            }

            console.log(`[MotorSincronizacion] ✅ Item sincronizado exitosamente en SQLite y Nube: ID=${res.id}`);
            procesadosExitosos++;
          } else {
            console.warn(`[MotorSincronizacion] ❌ Error reportado por servidor para Item ID ${res.id}: ${res.mensajeError}`);
            await db.runAsync(
              `UPDATE cola_sincronizacion SET estado = 'ERROR', mensaje_error = ?, numero_reintentos = numero_reintentos + 1 WHERE id = ?`,
              [res.mensajeError || 'Error en servidor', res.id]
            );
          }
        }
      }

      await db.runAsync(`UPDATE tiendas SET ultima_sincronizacion = ?`, [ahoraIso]);
      this.estaEnLinea = true;
      this.notificarEscuchadores(true);

      return {
        exito: true,
        procesados: procesadosExitosos,
        mensaje: `Sincronización exitosa: ${procesadosExitosos} registros guardados en la nube.`,
      };
    } catch (error: any) {
      console.warn('[MotorSincronizacion] ⚠️ Modo Offline: No se pudo conectar con el backend:', error.message || error);
      this.estaEnLinea = false;
      this.notificarEscuchadores(false);
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
   * Realiza la descarga inicial o restauración completa (Pull Sync) desde la nube hacia la BD SQLite local.
   */
  public async descargarDatosServidor(documentoPropietario: string, clave?: string): Promise<{ exito: boolean; mensajeError?: string }> {
    try {
      const docLimpio = documentoPropietario.trim();
      const claveParam = clave ? `?clave=${encodeURIComponent(clave.trim())}` : '';
      const urlFinal = `${CONFIG_SYNC.BACKEND_URL}/sync/pull/${encodeURIComponent(docLimpio)}${claveParam}`;

      console.log(`[MotorSincronizacion] ⬇️ Iniciando Pull Sync desde ${urlFinal}`);

      const response = await fetch(urlFinal, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const dataErr = await response.json().catch(() => null);
        const msgErr = dataErr?.mensaje || dataErr?.message || 'No se encontró la tienda o la contraseña ingresada es incorrecta.';
        return { exito: false, mensajeError: msgErr };
      }

      const data = await response.json();
      if (!data.exito || !data.tienda) {
        return { exito: false, mensajeError: data.mensaje || 'No se encontraron datos válidos de la tienda.' };
      }

      const db = obtenerBaseDatos();
      const ahoraIso = new Date().toISOString();
      const t = data.tienda;

      await db.withTransactionAsync(async () => {
        // 1. Sembrar Tienda
        await db.runAsync(
          `INSERT OR REPLACE INTO tiendas (id, nombre, nombre_propietario, documento_propietario, telefono, correo, direccion, ciudad, limite_credito_predeterminado, fecha_creacion, fecha_actualizacion, ultima_sincronizacion)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            t.id,
            t.nombre,
            t.nombrePropietario || t.nombre_propietario || 'Propietario',
            t.documentoPropietario || t.documento_propietario || docLimpio,
            t.telefono || '',
            t.correo || '',
            t.direccion || '',
            t.ciudad || '',
            t.limiteCreditoPredeterminado || t.limite_credito_predeterminado || 100000,
            t.fechaCreacion || t.fecha_creacion || ahoraIso,
            t.fechaActualizacion || t.fecha_actualizacion || ahoraIso,
            ahoraIso,
          ]
        );

        // 2. Sembrar Clientes
        if (Array.isArray(data.clientes)) {
          for (const c of data.clientes) {
            await db.runAsync(
              `INSERT OR REPLACE INTO clientes (id, tienda_id, numero_documento, nombre, telefono, correo, notificaciones_autorizadas, correo_verificado, limite_credito_personalizado, saldo_actual, fecha_creacion, fecha_actualizacion)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                c.id,
                c.tiendaId || c.tienda_id || t.id,
                c.numeroDocumento || c.numero_documento,
                c.nombre,
                c.telefono || '',
                c.correo || '',
                c.notificacionesAutorizadas ? 1 : 0,
                c.correoVerificado ? 1 : 0,
                c.limiteCreditoPersonalizado || null,
                c.saldoActual || 0,
                c.fechaCreacion || c.fecha_creacion || ahoraIso,
                c.fechaActualizacion || c.fecha_actualizacion || ahoraIso,
              ]
            );
          }
        }

        // 3. Sembrar Movimientos
        if (Array.isArray(data.movimientos)) {
          for (const m of data.movimientos) {
            await db.runAsync(
              `INSERT OR REPLACE INTO movimientos (id, tienda_id, cliente_id, tipo, monto, descripcion, saldo_anterior, nuevo_saldo, estado_sincronizacion, fecha_creacion, fecha_sincronizacion)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                m.id,
                m.tiendaId || m.tienda_id || t.id,
                m.clienteId || m.cliente_id,
                m.tipo,
                m.monto,
                m.descripcion || '',
                m.saldoAnterior || 0,
                m.nuevoSaldo || 0,
                'SINCRONIZADO',
                m.fechaCreacion || m.fecha_creacion || ahoraIso,
                ahoraIso,
              ]
            );
          }
        }
      });

      console.log(`[MotorSincronizacion] ✅ Pull Sync completado exitosamente para tienda ${t.nombre}. Clientes: ${data.clientes?.length || 0}, Movimientos: ${data.movimientos?.length || 0}`);
      this.estaEnLinea = true;
      this.notificarEscuchadores(true);
      return { exito: true };
    } catch (e: any) {
      console.warn('[MotorSincronizacion] ⚠️ Error en descargarDatosServidor (Pull Sync):', e);
      return { exito: false, mensajeError: e.message || 'Error de conexión con el servidor.' };
    }
  }

  /**
   * Obtiene el resumen del estado de sincronización
   */
  public async obtenerResumen(): Promise<ResumenSincronizacion> {
    const db = obtenerBaseDatos();
    const resCola = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM cola_sincronizacion WHERE estado = 'PENDIENTE' OR estado = 'ERROR'`
    );
    const resMovs = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM movimientos WHERE estado_sincronizacion = 'PENDIENTE' OR estado_sincronizacion IS NULL`
    );

    const countCola = resCola?.count ?? 0;
    const countMovs = resMovs?.count ?? 0;
    const pendientesCount = Math.max(countCola, countMovs);

    return {
      pendientesCount,
      estaEnLinea: this.estaEnLinea,
    };
  }
}

export const motorSincronizacion = new MotorSincronizacion();
