/**
 * Core Data Models for Gestor Digital de Fiados
 * Offline-First TypeScript Interfaces
 */

export type TransactionType = 'FIADO' | 'PAGO' | 'AJUSTE' | 'ANULACION';
export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface Store {
  id: string; // UUID v4
  name: string;
  ownerName: string;
  ownerDocument: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  defaultCreditLimit: number;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt?: string;
}

export interface Customer {
  id: string; // UUID v4
  storeId: string;
  documentNumber: string;
  name: string;
  phone: string;
  email?: string;
  notificationsAuthorized: boolean;
  emailVerified: boolean;
  customCreditLimit?: number; // Overrides store default if set
  currentBalance: number;     // Recalculated locally upon transactions
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string; // UUID v4 generated locally
  storeId: string;
  customerId: string;
  type: TransactionType;
  amount: number;             // Positive for FIADO, Positive for PAGO (handled in math)
  description?: string;
  previousBalance: number;
  newBalance: number;
  reasonForAnnulment?: string;
  syncStatus: SyncStatus;
  createdAt: string;          // ISO timestamp
  syncedAt?: string;
}

export interface SyncQueueItem {
  id: string; // UUID v4
  entityType: 'STORE' | 'CUSTOMER' | 'TRANSACTION';
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: string; // JSON Stringified entity
  status: SyncStatus;
  retryCount: number;
  errorMessage?: string;
  createdAt: string;
}

export interface SyncSummary {
  pendingCount: number;
  lastSyncedAt?: string;
  isOnline: boolean;
}
