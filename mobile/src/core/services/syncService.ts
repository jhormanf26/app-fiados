import { syncRepository } from '../repositories/syncRepository';

export const BACKEND_URL = 'https://back-fiaya.desaroollo.site/api/v1';

export interface ResultadoSincronizacion {
  exito: boolean;
  procesados: number;
  pendientes: number;
  mensaje: string;
}

export const syncService = {
  /**
   * Ejecuta la sincronización remota enviando la cola Outbox pendiente al servidor backend Spring Boot
   */
  async ejecutarSincronizacion(tiendaId?: string): Promise<ResultadoSincronizacion> {
    try {
      const cola = await syncRepository.obtenerColaPendiente();
      if (cola.length === 0) {
        return {
          exito: true,
          procesados: 0,
          pendientes: 0,
          mensaje: 'La aplicación ya está al día.',
        };
      }

      const mutaciones = cola.map((item) => {
        let payloadObj = {};
        try {
          payloadObj = typeof item.payload === 'string' ? JSON.parse(item.payload) : item.payload;
        } catch (e) {
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

      const bodyPayload = {
        tiendaId: tiendaId || 'tienda-local',
        mutaciones,
      };

      const response = await fetch(`${BACKEND_URL}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        throw new Error(`El servidor respondió con código HTTP ${response.status}`);
      }

      const data = await response.json();
      const idsExitosos: string[] = [];

      if (data.resultados && Array.isArray(data.resultados)) {
        for (const res of data.resultados) {
          if (res.estado === 'SINCRONIZADO') {
            idsExitosos.push(res.id);
          } else {
            await syncRepository.registrarErrorItem(res.id, res.mensajeError || 'Error desconocido en servidor');
          }
        }
      }

      if (idsExitosos.length > 0) {
        await syncRepository.marcarComoSincronizados(idsExitosos);
      }

      const pendientesRestantes = await syncRepository.obtenerCantidadPendientes();

      return {
        exito: true,
        procesados: idsExitosos.length,
        pendientes: pendientesRestantes,
        mensaje: `Sincronizados ${idsExitosos.length} registros con la nube.`,
      };
    } catch (error: any) {
      console.warn('[SyncService] Modo Offline: No se pudo conectar con el backend:', error.message || error);
      const pendientes = await syncRepository.obtenerCantidadPendientes();

      return {
        exito: false,
        procesados: 0,
        pendientes,
        mensaje: 'Modo Offline: Operaciones guardadas localmente. Se sincronizarán al reconectar a internet.',
      };
    }
  },

  /**
   * Obtiene la cantidad de ítems pendientes por sincronizar
   */
  async obtenerPendientes(): Promise<number> {
    return await syncRepository.obtenerCantidadPendientes();
  },
};
