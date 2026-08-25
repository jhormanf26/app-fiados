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
- **Filtros Temporales en Cartera:** Gráfico/Resumen de cartera interactivo con periodos (Hoy, 7 Días, 15 Días, 30 Días, Siempre).

## Recent Progress
- Cambiada la marca oficial de la aplicación a **FiaYa** en todas las pantallas y archivos de configuración (`app.json`, `LoginScreen`, `RegistroTienda`, `ConsultaCliente`, `Configuracion`, `DetalleCliente`).
- Creada la arquitectura completa del Backend Spring Boot 3 en `backend/` con entidades JPA (`TiendaEntity`, `ClienteEntity`, `MovimientoEntity`), repositorios y servicios.
- Desarrollado el motor de sincronización por lote idempotente `/api/v1/sync`.
- Implementado el motor de sincronización móvil Outbox en SQLite (`syncRepository.ts`, `syncService.ts`, `syncEngine.ts`) con listeners de red automáticos NetInfo y botón manual en encabezado **`🔄 FiaYa`** / **`Synced`**.
- Ejecutadas pruebas de integración completas (12/12 pasos exitosos) y comprobación TypeScript (0 errores).
- Realizado commit (`8cf7383`) y push a la rama `main` en GitHub (`https://github.com/jhormanf26/app-fiados.git`).
