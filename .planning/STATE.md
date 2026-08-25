# State — Gestor Digital de Fiados

## Current Milestone & Phase
- **Active Milestone:** Milestone 2: Tendero Workflows & Offline Features
- **Active Phase:** Phase 2.2: Customer View & Deudor Secure Lookup

## Key Technical Decisions
- **Estructura de UI Móvil:** `React Navigation` (Bottom Tabs & Native Stack) + `React Native Paper`.
- **Navegación:**
  - 🏠 **Inicio (`InicioScreen`)**: Dashboard métricas de deuda, clientes deudores, cola pendientes y badges de red.
  - 👥 **Clientes (`ClientesScreen` & `DetalleClienteScreen`)**: Buscador instantáneo, creación/edición de clientes, visualización de historial e inserción de fiados/pagos/anulaciones.
  - ⚙️ **Ajustes (`ConfiguracionScreen`)**: Edición de datos de la tienda y límite de crédito por defecto.
- **Modales Reutilizables:** `NuevoMovimientoModal` y `CrearClienteModal`.

- **Saldo a Favor (Credit Balance):** Permitir saldos negativos (`saldoActual < 0`) cuando un cliente realiza un pago mayor a su deuda. Las compras futuras deducen automáticamente de este saldo.
- **Cálculo de Deuda Total por Cobrar:** Suma únicamente deudas activas positivas (`saldoActual > 0`) para evitar que saldos a favor distorsionen la cartera por cobrar.
- **Alerta de Límite Superado:** Modal interactivo de advertencia que desglosa deuda previa, nuevo fiado y exceso antes de autorizar transacciones.
- **Filtros Temporales en Cartera:** Gráfico/Resumen de cartera interactivo con periodos (Hoy, 7 Días, 15 Días, 30 Días, Siempre).
- **Directorio de Clientes:** Pestaña `Al Día` incluye saldos $0 y a favor; pestaña `✨ Saldo a Favor` para saldos negativos.

## Recent Progress
- Rediseñada tarjeta Hero del Dashboard y botones destacados "Nuevo Fiado" y "Registrar Pago".
- Agregado modal de confirmación por límite de crédito superado en `NuevoMovimientoModal`.
- Formateo de moneda en tiempo real con separadores de miles colombianos (`COP`).
- Implementado sistema completo de Saldo a Favor en repositorios y pantallas.
- Agregado selector de periodos temporales interactivo en el Resumen de Cartera.
- Ajustado espaciado entre botones en `ConfiguracionScreen`.
- Creada y ejecutada la suite de pruebas de integración TDD `tenderoUserJourney.test.ts` (11/11 escenarios completados).
