# Requirements — Gestor Digital de Fiados

## Functional Requirements (MVP)

### 1. Store Management (Tendero)
- [ ] Store creation and configuration (Store name, owner name, ID, phone, email, address).
- [ ] General credit limit configuration.
- [ ] Notification settings.

### 2. Customer Management
- [ ] Customer CRUD (ID document, name, phone, email, notification consent, OTP verification status).
- [ ] Custom credit limit per customer.
- [ ] Current balance calculation and chronological movement history.
- [ ] Customer search by name, ID document, or phone.

### 3. Fiados & Payments (Transactions)
- [ ] Register new fiado (Amount, description, auto timestamp, UUID).
- [ ] Register payment / partial payment (Amount, description, auto timestamp, UUID).
- [ ] Instant balance recalculation.
- [ ] Credit limit warnings and blocking policies when limit is exceeded.
- [ ] Movement reversals/annulments (soft cancel with reason, audit trail).

### 4. Offline-First & Sync Engine
- [ ] 100% offline operational capability for all store and transaction features.
- [ ] Local Outbox Queue with statuses (`PENDING`, `SYNCING`, `SYNCED`).
- [ ] Auto-sync when internet connection is restored via NetInfo.
- [ ] Last sync timestamp display per store.

### 5. Customer Portal (Deudor)
- [ ] Secure identification/authentication mechanism for customers.
- [ ] Overview of total debt across all stores.
- [ ] Store-by-store breakdown of balances and itemized movements.
- [ ] Last sync timestamp visibility per store.

### 6. Notifications & Security
- [ ] OTP email verification flow for customer notification consent.
- [ ] Email notifications on new fiados and payments when authorized.
- [ ] Strict JWT auth for Tendero and Cliente roles.
