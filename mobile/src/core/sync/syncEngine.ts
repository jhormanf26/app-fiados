import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';
import { getDatabase } from '../database/db';
import { SyncQueueItem, SyncStatus, SyncSummary } from '../types/database';

type NetworkListener = (isOnline: boolean) => void;

class SyncEngine {
  private isOnline: boolean = false;
  private listeners: Set<NetworkListener> = new Set();
  private isSyncing: boolean = false;

  constructor() {
    this.initNetworkListener();
  }

  private initNetworkListener() {
    NetInfo.addEventListener((state: NetInfoState) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      if (this.isOnline !== online) {
        this.isOnline = online;
        this.notifyListeners(online);
        if (online) {
          this.triggerSync();
        }
      }
    });
  }

  public subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    listener(this.isOnline);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(isOnline: boolean) {
    this.listeners.forEach((listener) => listener(isOnline));
  }

  /**
   * Queue a new mutation into the local sync_queue table
   */
  public async queueItem(
    entityType: 'STORE' | 'CUSTOMER' | 'TRANSACTION',
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    payload: object
  ): Promise<string> {
    const db = getDatabase();
    const id = Crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const payloadStr = JSON.stringify(payload);

    await db.runAsync(
      `INSERT INTO sync_queue (id, entity_type, action, payload, status, retry_count, created_at)
       VALUES (?, ?, ?, ?, 'PENDING', 0, ?)`,
      [id, entityType, action, payloadStr, createdAt]
    );

    // Try syncing immediately if online
    if (this.isOnline) {
      this.triggerSync();
    }

    return id;
  }

  /**
   * Trigger the sync engine process (Pushes Outbox queue to Backend API)
   */
  public async triggerSync(): Promise<void> {
    if (this.isSyncing || !this.isOnline) {
      return;
    }

    this.isSyncing = true;
    try {
      const db = getDatabase();
      const pendingItems = await db.getAllAsync<SyncQueueItem>(
        `SELECT * FROM sync_queue WHERE status = 'PENDING' ORDER BY created_at ASC LIMIT 50`
      );

      if (pendingItems.length === 0) {
        this.isSyncing = false;
        return;
      }

      console.log(`[SyncEngine] Found ${pendingItems.length} items to synchronize with server.`);

      // TODO: Connect with Spring Boot /api/v1/sync endpoint once Backend is active.
      // For local offline milestone: Items stay queued in PENDING status cleanly.

    } catch (error) {
      console.error('[SyncEngine] Error processing sync queue:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get sync summary status
   */
  public async getSummary(): Promise<SyncSummary> {
    const db = getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM sync_queue WHERE status = 'PENDING'`
    );

    return {
      pendingCount: result?.count ?? 0,
      isOnline: this.isOnline,
    };
  }
}

export const syncEngine = new SyncEngine();
