import * as Crypto from 'expo-crypto';
import { getDatabase } from '../database/db';
import { Customer } from '../types/database';
import { syncEngine } from '../sync/syncEngine';
import { storeRepository } from './storeRepository';

export class CustomerRepository {
  /**
   * Search customers by name, document number, or phone
   */
  public async getCustomers(storeId: string, searchTerm?: string): Promise<Customer[]> {
    const db = getDatabase();
    let query = `SELECT * FROM customers WHERE store_id = ?`;
    const params: any[] = [storeId];

    if (searchTerm && searchTerm.trim().length > 0) {
      const term = `%${searchTerm.trim()}%`;
      query += ` AND (name LIKE ? OR document_number LIKE ? OR phone LIKE ?)`;
      params.push(term, term, term);
    }

    query += ` ORDER BY name ASC`;

    const rows = await db.getAllAsync<any>(query, params);

    return rows.map((row) => this.mapRowToCustomer(row));
  }

  /**
   * Get a single customer by ID
   */
  public async getCustomerById(id: string): Promise<Customer | null> {
    const db = getDatabase();
    const row = await db.getFirstAsync<any>(`SELECT * FROM customers WHERE id = ?`, [id]);
    if (!row) return null;
    return this.mapRowToCustomer(row);
  }

  /**
   * Calculate effective credit limit for a customer
   * (Returns custom limit if set, otherwise store default limit)
   */
  public async getEffectiveCreditLimit(customer: Customer): Promise<number> {
    if (customer.customCreditLimit !== undefined && customer.customCreditLimit !== null) {
      return customer.customCreditLimit;
    }
    const store = await storeRepository.getStore();
    return store?.defaultCreditLimit ?? 100000;
  }

  /**
   * Create a new customer
   */
  public async createCustomer(
    storeId: string,
    data: Omit<Customer, 'id' | 'storeId' | 'currentBalance' | 'createdAt' | 'updatedAt'>
  ): Promise<Customer> {
    const db = getDatabase();
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();

    const newCustomer: Customer = {
      id,
      storeId,
      ...data,
      currentBalance: 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.runAsync(
      `INSERT INTO customers (id, store_id, document_number, name, phone, email, notifications_authorized, email_verified, custom_credit_limit, current_balance, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newCustomer.id,
        newCustomer.storeId,
        newCustomer.documentNumber,
        newCustomer.name,
        newCustomer.phone,
        newCustomer.email ?? null,
        newCustomer.notificationsAuthorized ? 1 : 0,
        newCustomer.emailVerified ? 1 : 0,
        newCustomer.customCreditLimit ?? null,
        0,
        now,
        now,
      ]
    );

    await syncEngine.queueItem('CUSTOMER', 'CREATE', newCustomer);
    return newCustomer;
  }

  /**
   * Update customer details or custom limit
   */
  public async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer | null> {
    const existing = await this.getCustomerById(id);
    if (!existing) return null;

    const db = getDatabase();
    const now = new Date().toISOString();

    const updated: Customer = {
      ...existing,
      ...data,
      updatedAt: now,
    };

    await db.runAsync(
      `UPDATE customers SET document_number = ?, name = ?, phone = ?, email = ?, notifications_authorized = ?, email_verified = ?, custom_credit_limit = ?, updated_at = ? WHERE id = ?`,
      [
        updated.documentNumber,
        updated.name,
        updated.phone,
        updated.email ?? null,
        updated.notificationsAuthorized ? 1 : 0,
        updated.emailVerified ? 1 : 0,
        updated.customCreditLimit ?? null,
        now,
        id,
      ]
    );

    await syncEngine.queueItem('CUSTOMER', 'UPDATE', updated);
    return updated;
  }

  private mapRowToCustomer(row: any): Customer {
    return {
      id: row.id,
      storeId: row.store_id,
      documentNumber: row.document_number,
      name: row.name,
      phone: row.phone,
      email: row.email ?? undefined,
      notificationsAuthorized: Boolean(row.notifications_authorized),
      emailVerified: Boolean(row.email_verified),
      customCreditLimit: row.custom_credit_limit ?? undefined,
      currentBalance: row.current_balance,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const customerRepository = new CustomerRepository();
