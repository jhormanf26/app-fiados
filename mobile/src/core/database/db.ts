import { TODOS_LOS_ESQUEMAS } from './schema';

const NOMBRE_BD = 'fiados_local_v2.db';

export interface AdaptadorBaseDatos {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: any[]): Promise<any>;
  getAllAsync<T>(sql: string, params?: any[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params?: any[]): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}

/**
 * Adaptador Web con LocalStorage para vista previa en navegadores sin SharedArrayBuffer
 */
class AdaptadorBaseDatosWeb implements AdaptadorBaseDatos {
  private tablas: Record<string, any[]> = {
    tiendas: [],
    clientes: [],
    movimientos: [],
    cola_sincronizacion: [],
  };

  constructor() {
    this.cargarStorage();
  }

  private cargarStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const guardado = window.localStorage.getItem(NOMBRE_BD);
        if (guardado) {
          this.tablas = JSON.parse(guardado);
          this.sanitizarTablas();
        }
      }
    } catch (e) {
      console.warn('[WebDB] Error al cargar localStorage:', e);
    }
  }

  private sanitizarTablas() {
    if (Array.isArray(this.tablas.movimientos)) {
      this.tablas.movimientos = this.tablas.movimientos.map((m) => {
        let tipoFixed = m.tipo;
        let montoFixed = m.monto;
        let fechaFixed = m.fecha_creacion;

        if (typeof tipoFixed === 'number' || (tipoFixed !== 'FIADO' && tipoFixed !== 'PAGO' && tipoFixed !== 'ANULACION')) {
          montoFixed = Number(tipoFixed) || Number(m.monto) || 0;
          tipoFixed = 'FIADO';
        }

        if (!fechaFixed || typeof fechaFixed !== 'string' || fechaFixed.includes('undefined') || fechaFixed.includes('Invalid')) {
          fechaFixed = new Date().toISOString();
        }

        return {
          ...m,
          tipo: tipoFixed,
          monto: Number(montoFixed) || 0,
          fecha_creacion: fechaFixed,
        };
      });
    }
  }

  private guardarStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(NOMBRE_BD, JSON.stringify(this.tablas));
      }
    } catch (e) {
      console.warn('[WebDB] Error al guardar localStorage:', e);
    }
  }

  async execAsync(sql: string): Promise<void> {
    return;
  }

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    await task();
    this.guardarStorage();
  }

  async runAsync(sql: string, params: any[] = []): Promise<any> {
    const cleanSql = sql.trim().toUpperCase();

    if (cleanSql.startsWith('INSERT INTO TIENDAS')) {
      const tienda = {
        id: params[0],
        nombre: params[1],
        nombre_propietario: params[2],
        documento_propietario: params[3],
        telefono: params[4],
        correo: params[5],
        direccion: params[6],
        ciudad: params[7],
        limite_credito_predeterminado: params[8],
        fecha_creacion: params[9],
        fecha_actualizacion: params[10],
      };
      this.tablas.tiendas = this.tablas.tiendas.filter((t) => t.id !== tienda.id);
      this.tablas.tiendas.push(tienda);
    } else if (cleanSql.startsWith('UPDATE TIENDAS')) {
      const tiendaId = params[params.length - 1];
      const existente = this.tablas.tiendas.find((t) => t.id === tiendaId);
      if (existente) {
        existente.nombre = params[0];
        existente.nombre_propietario = params[1];
        existente.documento_propietario = params[2];
        existente.telefono = params[3];
        existente.correo = params[4];
        existente.direccion = params[5];
        existente.ciudad = params[6];
        existente.limite_credito_predeterminado = params[7];
        existente.fecha_actualizacion = params[8];
      }
    } else if (cleanSql.startsWith('INSERT INTO CLIENTES')) {
      const cliente = {
        id: params[0],
        tienda_id: params[1],
        numero_documento: params[2],
        nombre: params[3],
        telefono: params[4],
        correo: params[5],
        notificaciones_autorizadas: params[6],
        correo_verificado: params[7],
        limite_credito_personalizado: params[8],
        saldo_actual: params[9],
        fecha_creacion: params[10],
        fecha_actualizacion: params[11],
      };
      this.tablas.clientes = this.tablas.clientes.filter((c) => c.id !== cliente.id);
      this.tablas.clientes.push(cliente);
    } else if (cleanSql.startsWith('UPDATE CLIENTES SET SALDO_ACTUAL')) {
      const clienteId = params[2];
      const existente = this.tablas.clientes.find((c) => c.id === clienteId);
      if (existente) {
        existente.saldo_actual = params[0];
        existente.fecha_actualizacion = params[1];
      }
    } else if (cleanSql.startsWith('UPDATE CLIENTES SET NUMERO_DOCUMENTO')) {
      const clienteId = params[params.length - 1];
      const existente = this.tablas.clientes.find((c) => c.id === clienteId);
      if (existente) {
        existente.numero_documento = params[0];
        existente.nombre = params[1];
        existente.telefono = params[2];
        existente.correo = params[3];
        existente.notificaciones_autorizadas = params[4];
        existente.correo_verificado = params[5];
        existente.limite_credito_personalizado = params[6];
        existente.fecha_actualizacion = params[7];
      }
    } else if (cleanSql.startsWith('INSERT INTO MOVIMIENTOS')) {
      const es10Params = params.length >= 10;
      const tipoVal = es10Params
        ? params[3]
        : cleanSql.includes("'FIADO'") ? 'FIADO' : cleanSql.includes("'PAGO'") ? 'PAGO' : 'FIADO';
      const montoVal = es10Params ? params[4] : params[3];
      const descVal = es10Params ? params[5] : params[4];
      const saldoAntVal = es10Params ? params[6] : params[5];
      const nuevoSaldoVal = es10Params ? params[7] : params[6];
      const estadoSyncVal = es10Params ? params[8] : 'PENDIENTE';
      const fechaCreacionVal = es10Params ? params[9] : params[7] || new Date().toISOString();

      const mov = {
        id: params[0],
        tienda_id: params[1],
        cliente_id: params[2],
        tipo: tipoVal,
        monto: Number(montoVal) || 0,
        descripcion: descVal,
        saldo_anterior: Number(saldoAntVal) || 0,
        nuevo_saldo: Number(nuevoSaldoVal) || 0,
        estado_sincronizacion: estadoSyncVal,
        fecha_creacion: fechaCreacionVal,
      };
      this.tablas.movimientos.unshift(mov);
    } else if (cleanSql.startsWith('UPDATE MOVIMIENTOS SET TIPO')) {
      const movId = params[params.length - 1];
      const existente = this.tablas.movimientos.find((m) => m.id === movId);
      if (existente) {
        existente.tipo = 'ANULACION';
        existente.motivo_anulacion = params[0];
        existente.saldo_anterior = params[1];
        existente.nuevo_saldo = params[2];
        existente.estado_sincronizacion = 'PENDIENTE';
      }
    } else if (cleanSql.startsWith('INSERT INTO COLA_SINCRONIZACION')) {
      const q = {
        id: params[0],
        tipo_entidad: params[1],
        accion: params[2],
        payload: params[3],
        estado: params[4],
        numero_reintentos: params[5],
        fecha_creacion: params[6],
      };
      this.tablas.cola_sincronizacion.push(q);
    }

    this.guardarStorage();
    return { changes: 1 };
  }

  async getAllAsync<T>(sql: string, params: any[] = []): Promise<T[]> {
    const cleanSql = sql.trim().toUpperCase();

    if (cleanSql.includes('FROM CLIENTES')) {
      let resultado = [...this.tablas.clientes];
      if (params.length > 1 && params[1]) {
        const termino = String(params[1]).replace(/%/g, '').toLowerCase();
        resultado = resultado.filter(
          (c) =>
            c.nombre.toLowerCase().includes(termino) ||
            c.numero_documento.toLowerCase().includes(termino) ||
            c.telefono.toLowerCase().includes(termino)
        );
      }
      return resultado as unknown as T[];
    }

    if (cleanSql.includes('FROM MOVIMIENTOS') && cleanSql.includes('JOIN CLIENTES')) {
      const tiendaId = params[0];
      const resultado = this.tablas.movimientos
        .filter((m) => (m.tienda_id === tiendaId || !m.tienda_id))
        .slice(0, 5)
        .map((m) => {
          const cli = this.tablas.clientes.find((c) => c.id === m.cliente_id);
          return {
            ...m,
            nombre_cliente: cli ? cli.nombre : 'Cliente',
          };
        });
      return resultado as unknown as T[];
    }

    if (cleanSql.includes('FROM MOVIMIENTOS')) {
      const clienteId = params[0];
      const resultado = this.tablas.movimientos.filter((m) => m.cliente_id === clienteId);
      return resultado as unknown as T[];
    }

    if (cleanSql.includes('FROM COLA_SINCRONIZACION')) {
      const resultado = this.tablas.cola_sincronizacion.filter((q) => q.estado === 'PENDIENTE');
      return resultado as unknown as T[];
    }

    return [] as T[];
  }

  async getFirstAsync<T>(sql: string, params: any[] = []): Promise<T | null> {
    const cleanSql = sql.trim().toUpperCase();

    if (cleanSql.includes('FROM TIENDAS')) {
      return (this.tablas.tiendas[0] ?? null) as unknown as T | null;
    }

    if (cleanSql.includes('FROM CLIENTES')) {
      const clienteId = params[0];
      const cliente = this.tablas.clientes.find((c) => c.id === clienteId);
      return (cliente ?? null) as unknown as T | null;
    }

    if (cleanSql.includes('SUM(MONTO) AS TOTAL FROM MOVIMIENTOS')) {
      const tiendaId = params[0];
      const esFiado = cleanSql.includes("TIPO = 'FIADO'");
      const esPago = cleanSql.includes("TIPO = 'PAGO'");
      const tipoBuscado = esFiado ? 'FIADO' : esPago ? 'PAGO' : null;

      const items = this.tablas.movimientos.filter(
        (m) => (m.tienda_id === tiendaId || !m.tienda_id) && (!tipoBuscado || m.tipo === tipoBuscado)
      );
      const total = items.reduce((sum, m) => sum + (Number(m.monto) || 0), 0);
      return { total } as unknown as T;
    }

    if (cleanSql.includes('FROM MOVIMIENTOS')) {
      const movId = params[0];
      const mov = this.tablas.movimientos.find((m) => m.id === movId);
      return (mov ?? null) as unknown as T | null;
    }

    if (cleanSql.includes('COUNT(*) AS COUNT FROM COLA_SINCRONIZACION')) {
      const count = this.tablas.cola_sincronizacion.filter((q) => q.estado === 'PENDIENTE').length;
      return { count } as unknown as T;
    }

    return null;
  }
}

let instanciaBD: AdaptadorBaseDatos | null = null;

export function obtenerBaseDatos(): AdaptadorBaseDatos {
  if (!instanciaBD) {
    let isWeb = false;
    try {
      const RN = require('react-native');
      isWeb = RN?.Platform?.OS === 'web';
    } catch {
      isWeb = true;
    }

    const usaAdaptadorWeb = isWeb || typeof SharedArrayBuffer === 'undefined';

    if (usaAdaptadorWeb) {
      console.log('[SQLite] Usando adaptador Web (LocalStorage) para la vista previa del navegador.');
      instanciaBD = new AdaptadorBaseDatosWeb();
    } else {
      const SQLite = require('expo-sqlite');
      instanciaBD = SQLite.openDatabaseSync(NOMBRE_BD) as unknown as AdaptadorBaseDatos;
    }
  }
  return instanciaBD;
}

export async function inicializarBaseDatos(): Promise<boolean> {
  try {
    const db = obtenerBaseDatos();
    await db.withTransactionAsync(async () => {
      for (const esquema of TODOS_LOS_ESQUEMAS) {
        await db.execAsync(esquema);
      }
    });
    console.log('[SQLite] Base de datos local inicializada exitosamente.');
    return true;
  } catch (error) {
    console.error('[SQLite] Error al inicializar la base de datos:', error);
    return false;
  }
}
