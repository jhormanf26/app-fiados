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

## Recent Progress
- Instaladas dependencias `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`, `react-native-screens`.
- Creados modales y componentes de pantalla en `src/ui/`.
- Configurado `AppNavigator.tsx` y vinculado a `App.tsx`.
- Verificado con `npx tsc --noEmit` sin ningún error.
