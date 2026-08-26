# State — Gestor Digital de Fiados

## Current Milestone & Phase
- **Active Milestone:** Milestone 3: Spring Boot 3 Backend API & Outbox Sync Engine
- **Active Phase:** Phase 3.1: Java 17 Spring Boot Backend Structure & MySQL Sync Engine

## Key Technical Decisions
- **Estructura de UI Móvil:** `React Navigation` (Bottom Tabs & Native Stack) + `React Native Paper`.
- **Identidad de Marca:** **FiaYa** implementada de forma unificada en la app móvil y backend.
- **Backend Architecture (`backend/`):** Java 17 + Spring Boot 3.2+ + Spring Data JPA + MySQL 8.0.
- **Motor de Sincronización Idempotente (`/api/v1/sync`):** Outbox Batch Pattern que valida UUIDs de mutaciones para prevenir duplicados.
- **Portal de Consulta Pública de Clientes (`/api/v1/public/cliente-consulta`):** Consulta consolidada de deudas por número de documento.

- **Saldo a Favor (Credit Balance):** Permitir saldos negativos (`saldoActual < 0`) cuando un cliente realiza un pago mayor a su deuda. Las compras futuras deducen automáticamente de este saldo.
- **Cálculo de Deuda Total por Cobrar:** Suma únicamente deudas activas positivas (`saldoActual > 0`) para evitar que saldos a favor distorsionen la cartera por cobrar.
- **Alerta de Límite Superado:** Modal interactivo de advertencia que desglosa deuda previa, nuevo fiado y exceso antes de autorizar transacciones.
- **Componente Dinámico `<SyncHeaderBadge />`:** Sustituido el Chip hardcoded estático `"Synced"` por un indicador reactivo que refleja en tiempo real los estados `Sin Conexión` (offline/red fallida), `Pendientes (N)` (con conteo de la cola Outbox) y `Sincronizado`.
- **Actualización de Estado en SQLite:** Al recibir ACK `SINCRONIZADO` del servidor, el motor móvil actualiza `movimientos.estado_sincronizacion = 'SINCRONIZADO'` en la BD SQLite local.
- **Sistema de Observabilidad y Logging:** Implementado logging detallado estructurado con payloads JSON stringificados en `syncEngine.ts` (móvil) y Lombok `@Slf4j` en `SyncController.java` y `SyncService.java` (backend Spring Boot).

## Recent Progress
- Cambiada la marca oficial de la aplicación a **FiaYa** en todas las pantallas y archivos de configuración.
- Creada la arquitectura completa del Backend Spring Boot 3 en `backend/` con entidades JPA y servicio de sincronización `/api/v1/sync`.
- Creado el componente reutilizable `SyncHeaderBadge.tsx` e integrado en `InicioScreen`, `ClientesScreen`, `DetalleClienteScreen` y `ConfiguracionScreen`.
- Actualizado `syncEngine.ts` con chequeo proactivo inicial de red (`NetInfo.fetch()`), actualización explícita de SQLite y consola con payloads JSON.
- Agregados logs `@Slf4j` en `SyncController` y `SyncService` para auditar la recepción de mutaciones y su guardado en la base de datos MySQL.
- Ejecutadas pruebas de integración backend (`SyncServiceTest`) con 100% de éxito en JDK 21 y chequeo de compilación TypeScript (`tsc --noEmit`) con 0 errores.
