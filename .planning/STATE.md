# State — Gestor Digital de Fiados

## Current Milestone & Phase
- **Active Milestone:** Milestone 1: Mobile App Setup & Core SQLite Engine
- **Active Phase:** Phase 1.2: Database Repositories & Offline Outbox Services

## Key Technical Decisions
- **Stack:** React Native Expo SDK 57 (TypeScript), `expo-sqlite`, `expo-crypto`, `@react-native-community/netinfo`, `expo-secure-store`, `react-native-paper`.
- **Backend Stack:** Spring Boot 3+ (Java 17+), MySQL, Adminer on Dokploy.
- **Data Pattern:** Offline-First with Outbox Queue (`sync_queue`) and UUIDv4 primary keys generated locally on mobile devices.

## Recent Progress
- Initialized React Native Expo project in `mobile/`.
- Installed SDK native modules: `expo-sqlite`, `expo-crypto`, `@react-native-community/netinfo`, `expo-secure-store`, `react-native-paper`.
- Defined TypeScript models (`src/core/types/database.ts`).
- Defined SQLite schema tables (`stores`, `customers`, `transactions`, `sync_queue` in `src/core/database/schema.ts`).
- Created SQLite database initializer (`src/core/database/db.ts`).
- Created Outbox SyncEngine service (`src/core/sync/syncEngine.ts`).
- Verified TypeScript compilation cleanly (`npx tsc --noEmit` passed with 0 errors).
