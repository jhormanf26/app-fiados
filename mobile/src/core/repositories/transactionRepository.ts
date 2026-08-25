import * as Crypto from 'expo-crypto';
import { getDatabase } from '../database/db';
import { Transaction, TransactionType } from '../types/database';
import { customerRepository } from './customerRepository';
import { syncEngine } from '../sync/syncEngine';

export interface FiadoResult {
  transaction: Transaction;
  limitExceeded: boolean;
  effectiveLimit: number;
}

export class TransactionRepository {
  /**
   * Register a new Fiado (Debt increment)
   */
  public async addFiado(
    storeId: string,
    customerId: string,
    amount: number,
    description?: string
  ): Promise<FiadoResult> {
    if (amount <= 0) {
      throw new Error('El valor del fiado debe ser mayor a cero.');
    }

    const customer = await customerRepository.getCustomerById(customerId);
    if (!customer) {
      throw new Error('Cliente no encontrado.');
    }

    const db = getDatabase();
    const effectiveLimit = await customerRepository.getEffectiveCreditLimit(customer);
    const previousBalance = customer.currentBalance;
    const newBalance = previousBalance + amount;
    const limitExceeded = newBalance > effectiveLimit;

    const id = Crypto.randomUUID();
    const now = new Date().toISOString();

    const transaction: Transaction = {
      id,
      storeId,
      customerId,
      type: 'FIADO',
      amount,
      description,
      previousBalance,
      newBalance,
      syncStatus: 'PENDING',
      createdAt: now,
    };

    // Execute atomic transaction for customer balance and movement record
    await db.withTransactionAsync(async () => {
      // 1. Insert Transaction
      await db.runAsync(
        `INSERT INTO transactions (id, store_id, customer_id, type, amount, description, previous_balance, new_balance, sync_status, created_at)
         VALUES (?, ?, ?, 'FIADO', ?, ?, ?, ?, 'PENDING', ?)`,
        [id, storeId, customerId, amount, description ?? null, previousBalance, newBalance, now]
      );

      // 2. Update Customer Balance
      await db.runAsync(
        `UPDATE customers SET current_balance = ?, updated_at = ? WHERE id = ?`,
        [newBalance, now, customerId]
      );
    });

    await syncEngine.queueItem('TRANSACTION', 'CREATE', transaction);

    return {
      transaction,
      limitExceeded,
      effectiveLimit,
    };
  }

  /**
   * Register a Payment or Partial Abono (Debt reduction)
   */
  public async addPago(
    storeId: string,
    customerId: string,
    amount: number,
    description?: string
  ): Promise<Transaction> {
    if (amount <= 0) {
      throw new Error('El valor del pago debe ser mayor a cero.');
    }

    const customer = await customerRepository.getCustomerById(customerId);
    if (!customer) {
      throw new Error('Cliente no encontrado.');
    }

    const db = getDatabase();
    const previousBalance = customer.currentBalance;
    const newBalance = Math.max(0, previousBalance - amount);
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();

    const transaction: Transaction = {
      id,
      storeId,
      customerId,
      type: 'PAGO',
      amount,
      description,
      previousBalance,
      newBalance,
      syncStatus: 'PENDING',
      createdAt: now,
    };

    await db.withTransactionAsync(async () => {
      // 1. Insert Transaction
      await db.runAsync(
        `INSERT INTO transactions (id, store_id, customer_id, type, amount, description, previous_balance, new_balance, sync_status, created_at)
         VALUES (?, ?, ?, 'PAGO', ?, ?, ?, ?, 'PENDING', ?)`,
        [id, storeId, customerId, amount, description ?? null, previousBalance, newBalance, now]
      );

      // 2. Update Customer Balance
      await db.runAsync(
        `UPDATE customers SET current_balance = ?, updated_at = ? WHERE id = ?`,
        [newBalance, now, customerId]
      );
    });

    await syncEngine.queueItem('TRANSACTION', 'CREATE', transaction);

    return transaction;
  }

  /**
   * Soft Annulment of a transaction with an audit reason
   */
  public async annulTransaction(transactionId: string, reason: string): Promise<Transaction> {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Debe proporcionar un motivo para la anulación.');
    }

    const db = getDatabase();
    const row = await db.getFirstAsync<any>(`SELECT * FROM transactions WHERE id = ?`, [transactionId]);
    if (!row) {
      throw new Error('Movimiento no encontrado.');
    }

    if (row.type === 'ANULACION') {
      throw new Error('Este movimiento ya ha sido anulado anteriormente.');
    }

    const customer = await customerRepository.getCustomerById(row.customer_id);
    if (!customer) {
      throw new Error('Cliente asociado no encontrado.');
    }

    const now = new Date().toISOString();
    const originalType: TransactionType = row.type;
    const amount: number = row.amount;
    const previousBalance = customer.currentBalance;

    // Reverse balance effect
    let newBalance = previousBalance;
    if (originalType === 'FIADO') {
      newBalance = Math.max(0, previousBalance - amount);
    } else if (originalType === 'PAGO') {
      newBalance = previousBalance + amount;
    }

    const annulledTransaction: Transaction = {
      id: row.id,
      storeId: row.store_id,
      customerId: row.customer_id,
      type: 'ANULACION',
      amount: row.amount,
      description: row.description ?? undefined,
      previousBalance,
      newBalance,
      reasonForAnnulment: reason,
      syncStatus: 'PENDING',
      createdAt: row.created_at,
    };

    await db.withTransactionAsync(async () => {
      // 1. Mark transaction as ANULACION
      await db.runAsync(
        `UPDATE transactions SET type = 'ANULACION', reason_for_annulment = ?, previous_balance = ?, new_balance = ?, sync_status = 'PENDING' WHERE id = ?`,
        [reason, previousBalance, newBalance, transactionId]
      );

      // 2. Adjust customer balance back
      await db.runAsync(
        `UPDATE customers SET current_balance = ?, updated_at = ? WHERE id = ?`,
        [newBalance, now, row.customer_id]
      );
    });

    await syncEngine.queueItem('TRANSACTION', 'UPDATE', annulledTransaction);

    return annulledTransaction;
  }

  /**
   * Get chronological history of transactions for a customer
   */
  public async getCustomerHistory(customerId: string): Promise<Transaction[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM transactions WHERE customer_id = ? ORDER BY created_at DESC`,
      [customerId]
    );

    return rows.map((row) => ({
      id: row.id,
      storeId: row.store_id,
      customerId: row.customer_id,
      type: row.type as TransactionType,
      amount: row.amount,
      description: row.description ?? undefined,
      previousBalance: row.previous_balance,
      newBalance: row.new_balance,
      reasonForAnnulment: row.reason_for_annulment ?? undefined,
      syncStatus: row.sync_status,
      createdAt: row.created_at,
      syncedAt: row.synced_at ?? undefined,
    }));
  }
}

export const transactionRepository = new TransactionRepository();
