import * as SQLite from 'expo-sqlite';
import { ALL_SCHEMAS } from './schema';

const DB_NAME = 'fiados_local.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Obtain or initialize the local SQLite database instance.
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync(DB_NAME);
  }
  return dbInstance;
}

/**
 * Initialize local database tables and migrations
 */
export async function initDatabase(): Promise<boolean> {
  try {
    const db = getDatabase();
    await db.withTransactionAsync(async () => {
      for (const schema of ALL_SCHEMAS) {
        await db.execAsync(schema);
      }
    });
    console.log('[SQLite] Local database initialized successfully.');
    return true;
  } catch (error) {
    console.error('[SQLite] Error initializing database:', error);
    return false;
  }
}
