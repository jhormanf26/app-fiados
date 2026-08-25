/**
 * SQLite Database Schema Statements (expo-sqlite)
 */

export const CREATE_STORES_TABLE = `
  CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    owner_document TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT,
    city TEXT,
    default_credit_limit REAL DEFAULT 100000.0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_synced_at TEXT
  );
`;

export const CREATE_CUSTOMERS_TABLE = `
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY NOT NULL,
    store_id TEXT NOT NULL,
    document_number TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    notifications_authorized INTEGER DEFAULT 0,
    email_verified INTEGER DEFAULT 0,
    custom_credit_limit REAL,
    current_balance REAL DEFAULT 0.0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(store_id) REFERENCES stores(id)
  );
`;

export const CREATE_TRANSACTIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY NOT NULL,
    store_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    previous_balance REAL NOT NULL,
    new_balance REAL NOT NULL,
    reason_for_annulment TEXT,
    sync_status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TEXT NOT NULL,
    synced_at TEXT,
    FOREIGN KEY(store_id) REFERENCES stores(id),
    FOREIGN KEY(customer_id) REFERENCES customers(id)
  );
`;

export const CREATE_SYNC_QUEUE_TABLE = `
  CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY NOT NULL,
    entity_type TEXT NOT NULL,
    action TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TEXT NOT NULL
  );
`;

export const ALL_SCHEMAS = [
  CREATE_STORES_TABLE,
  CREATE_CUSTOMERS_TABLE,
  CREATE_TRANSACTIONS_TABLE,
  CREATE_SYNC_QUEUE_TABLE
];
