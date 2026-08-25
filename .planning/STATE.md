# State — Gestor Digital de Fiados

## Current Milestone & Phase
- **Active Milestone:** Milestone 1: Mobile App Setup & Core SQLite Engine (Spanish Refactor Complete)
- **Active Phase:** Phase 2.1: Navigation & Store Management UI

## Key Technical Decisions
- **Idioma del Código:** Todos los esquemas de SQLite, interfaces TypeScript, repositorios y modelos de dominio están en **Español** (`tiendas`, `clientes`, `movimientos`, `cola_sincronizacion`).
- **Stack:** React Native Expo SDK 57 (TypeScript), `expo-sqlite`, `expo-crypto`, `@react-native-community/netinfo`, `expo-secure-store`, `react-native-paper`.
- **Backend Stack:** Spring Boot 3+ (Java 17+), MySQL, Adminer en Dokploy.
- **Patrón de Datos:** Offline-First con Cola de Sincronización Outbox (`cola_sincronizacion`) e IDs `UUIDv4` generados localmente.

## Recent Progress
- Refactorizado completo de modelos, esquemas y repositorios al **Español**:
  - `src/core/types/database.ts` (`Tienda`, `Cliente`, `Movimiento`, `ItemColaSincronizacion`, `TipoMovimiento`, `EstadoSincronizacion`).
  - `src/core/database/schema.ts` (`tiendas`, `clientes`, `movimientos`, `cola_sincronizacion`).
  - `src/core/repositories/tiendaRepository.ts`.
  - `src/core/repositories/clienteRepository.ts`.
  - `src/core/repositories/movimientoRepository.ts`.
  - `src/core/sync/syncEngine.ts` (`motorSincronizacion`).
  - `App.tsx` (Dashboard de prueba traducido e integrado).
- Verificado con `npx tsc --noEmit` obteniendo 0 errores.
