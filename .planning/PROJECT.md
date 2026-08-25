# Project Overview — Gestor Digital de Fiados

## Summary
Mobile application for small merchants (grocery stores, bakeries, butcher shops, etc.) to digitalize debt management ("fiados") and payments, operating with an **offline-first** strategy. Includes a secure portal for customers to check their balances across stores.

## Tech Stack
- **Mobile App:** React Native with Expo (TypeScript)
- **Local DB (Offline):** `expo-sqlite`
- **ID Generator:** `expo-crypto` (`UUID v4`)
- **Network Listener:** `@react-native-community/netinfo`
- **Encrypted Storage:** `expo-secure-store`
- **Backend API:** Java 17+ / Spring Boot 3+ (Spring Data JPA, Security, Mail)
- **Server DB:** MySQL (Hosted on Dokploy)
- **DB GUI:** Adminer (Hosted on Dokploy)
- **Infrastructure:** Dokploy + Docker Containers

## Core Architecture Principles
1. **Offline-First:** All mutations (creates, updates, payments) are written directly to `expo-sqlite` with UUIDs. UI updates instantaneously.
2. **Outbox Pattern:** Transactions have statuses (`PENDING`, `SYNCING`, `SYNCED`). When online, pending items are dispatched to the Spring Boot `/api/v1/sync` endpoint.
3. **Idempotency:** Server checks UUID uniqueness before writing to MySQL to prevent duplicate transactions.
4. **Store Isolation:** Each store maintains strict separation of customer accounts and financial movements.
