# State — Gestor Digital de Fiados

## Current Milestone & Phase
- **Active Milestone:** Milestone 1: Mobile App Setup & Core SQLite Engine
- **Active Phase:** Phase 1.3: Mobile UI Navigation & Screen Components

## Key Technical Decisions
- **Stack:** React Native Expo SDK 57 (TypeScript), `expo-sqlite`, `expo-crypto`, `@react-native-community/netinfo`, `expo-secure-store`, `react-native-paper`.
- **Backend Stack:** Spring Boot 3+ (Java 17+), MySQL, Adminer on Dokploy.
- **Data Pattern:** Offline-First with Outbox Queue (`sync_queue`) and UUIDv4 primary keys generated locally on mobile devices.

## Recent Progress
- Created `storeRepository.ts` for store setup and default credit limit management.
- Created `customerRepository.ts` for customer CRUD, search by document/name/phone, and credit limit calculations.
- Created `transactionRepository.ts` for Fiados, Payments, Soft Annulments with audit reasons, and automatic insertion into `sync_queue`.
- Updated `App.tsx` with an interactive test dashboard allowing real-time Fiado ($50,000) and Payment ($20,000) execution, balance updates, limit warnings, and chronological history display.
- Verified TypeScript compilation cleanly (`npx tsc --noEmit` passed with 0 errors).
