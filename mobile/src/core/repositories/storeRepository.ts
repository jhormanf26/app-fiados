import * as Crypto from 'expo-crypto';
import { getDatabase } from '../database/db';
import { Store } from '../types/database';
import { syncEngine } from '../sync/syncEngine';

export class StoreRepository {
  /**
   * Get the current store configuration
   */
  public async getStore(): Promise<Store | null> {
    const db = getDatabase();
    const row = await db.getFirstAsync<any>(`SELECT * FROM stores LIMIT 1`);
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      ownerName: row.owner_name,
      ownerDocument: row.owner_document,
      phone: row.phone,
      email: row.email,
      address: row.address ?? undefined,
      city: row.city ?? undefined,
      defaultCreditLimit: row.default_credit_limit,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastSyncedAt: row.last_synced_at ?? undefined,
    };
  }

  /**
   * Create or update store configuration
   */
  public async saveStore(storeData: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>): Promise<Store> {
    const db = getDatabase();
    const existing = await this.getStore();
    const now = new Date().toISOString();

    if (existing) {
      const updated: Store = {
        ...existing,
        ...storeData,
        updatedAt: now,
      };

      await db.runAsync(
        `UPDATE stores SET name = ?, owner_name = ?, owner_document = ?, phone = ?, email = ?, address = ?, city = ?, default_credit_limit = ?, updated_at = ? WHERE id = ?`,
        [
          updated.name,
          updated.ownerName,
          updated.ownerDocument,
          updated.phone,
          updated.email,
          updated.address ?? null,
          updated.city ?? null,
          updated.defaultCreditLimit,
          now,
          updated.id,
        ]
      );

      await syncEngine.queueItem('STORE', 'UPDATE', updated);
      return updated;
    } else {
      const newStore: Store = {
        id: Crypto.randomUUID(),
        ...storeData,
        createdAt: now,
        updatedAt: now,
      };

      await db.runAsync(
        `INSERT INTO stores (id, name, owner_name, owner_document, phone, email, address, city, default_credit_limit, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newStore.id,
          newStore.name,
          newStore.ownerName,
          newStore.ownerDocument,
          newStore.phone,
          newStore.email,
          newStore.address ?? null,
          newStore.city ?? null,
          newStore.defaultCreditLimit,
          now,
          now,
        ]
      );

      await syncEngine.queueItem('STORE', 'CREATE', newStore);
      return newStore;
    }
  }
}

export const storeRepository = new StoreRepository();
