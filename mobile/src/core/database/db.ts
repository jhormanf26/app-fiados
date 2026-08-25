import * as SQLite from 'expo-sqlite';
import { TODOS_LOS_ESQUEMAS } from './schema';

const NOMBRE_BD = 'fiados_local_v2.db';

let instanciaBD: SQLite.SQLiteDatabase | null = null;

/**
 * Obtiene o inicializa la instancia singleton de SQLite local
 */
export function obtenerBaseDatos(): SQLite.SQLiteDatabase {
  if (!instanciaBD) {
    instanciaBD = SQLite.openDatabaseSync(NOMBRE_BD);
  }
  return instanciaBD;
}

/**
 * Inicializa las tablas locales y esquemas en español
 */
export async function inicializarBaseDatos(): Promise<boolean> {
  try {
    const db = obtenerBaseDatos();
    await db.withTransactionAsync(async () => {
      for (const esquema of TODOS_LOS_ESQUEMAS) {
        await db.execAsync(esquema);
      }
    });
    console.log('[SQLite] Base de datos local inicializada exitosamente en español.');
    return true;
  } catch (error) {
    console.error('[SQLite] Error al inicializar la base de datos:', error);
    return false;
  }
}
