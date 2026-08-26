/**
 * Esquema de Base de Datos SQLite en Español (expo-sqlite)
 */

export const TABLA_TIENDAS = `
  CREATE TABLE IF NOT EXISTS tiendas (
    id TEXT PRIMARY KEY NOT NULL,
    nombre TEXT NOT NULL,
    nombre_propietario TEXT NOT NULL,
    documento_propietario TEXT NOT NULL,
    clave TEXT,
    telefono TEXT NOT NULL,
    correo TEXT NOT NULL,
    direccion TEXT,
    ciudad TEXT,
    limite_credito_predeterminado REAL DEFAULT 100000.0,
    fecha_creacion TEXT NOT NULL,
    fecha_actualizacion TEXT NOT NULL,
    ultima_sincronizacion TEXT
  );
`;

export const TABLA_CLIENTES = `
  CREATE TABLE IF NOT EXISTS clientes (
    id TEXT PRIMARY KEY NOT NULL,
    tienda_id TEXT NOT NULL,
    numero_documento TEXT NOT NULL,
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL,
    correo TEXT,
    notificaciones_autorizadas INTEGER DEFAULT 0,
    correo_verificado INTEGER DEFAULT 0,
    limite_credito_personalizado REAL,
    saldo_actual REAL DEFAULT 0.0,
    fecha_creacion TEXT NOT NULL,
    fecha_actualizacion TEXT NOT NULL,
    FOREIGN KEY(tienda_id) REFERENCES tiendas(id)
  );
`;

export const TABLA_MOVIMIENTOS = `
  CREATE TABLE IF NOT EXISTS movimientos (
    id TEXT PRIMARY KEY NOT NULL,
    tienda_id TEXT NOT NULL,
    cliente_id TEXT NOT NULL,
    tipo TEXT NOT NULL,
    monto REAL NOT NULL,
    descripcion TEXT,
    saldo_anterior REAL NOT NULL,
    nuevo_saldo REAL NOT NULL,
    motivo_anulacion TEXT,
    estado_sincronizacion TEXT NOT NULL DEFAULT 'PENDIENTE',
    fecha_creacion TEXT NOT NULL,
    fecha_sincronizacion TEXT,
    FOREIGN KEY(tienda_id) REFERENCES tiendas(id),
    FOREIGN KEY(cliente_id) REFERENCES clientes(id)
  );
`;

export const TABLA_COLA_SINCRONIZACION = `
  CREATE TABLE IF NOT EXISTS cola_sincronizacion (
    id TEXT PRIMARY KEY NOT NULL,
    tipo_entidad TEXT NOT NULL,
    accion TEXT NOT NULL,
    payload TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'PENDIENTE',
    numero_reintentos INTEGER DEFAULT 0,
    mensaje_error TEXT,
    fecha_creacion TEXT NOT NULL
  );
`;

export const TODOS_LOS_ESQUEMAS = [
  TABLA_TIENDAS,
  TABLA_CLIENTES,
  TABLA_MOVIMIENTOS,
  TABLA_COLA_SINCRONIZACION
];
