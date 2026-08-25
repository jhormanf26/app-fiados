# Proyecto — Gestor Digital de Fiados

## 1. Resumen

Aplicación móvil orientada principalmente a tiendas pequeñas, supermercados, panaderías, carnicerías y comercios similares que actualmente llevan el registro de fiados en cuadernos.

El objetivo es digitalizar la gestión de fiados y pagos sin exigir computador ni conexión permanente a Internet.

El principio técnico más importante es **offline-first**: la aplicación debe poder utilizarse sin Internet, almacenar las operaciones localmente y sincronizarlas automáticamente cuando vuelva la conexión.

El proyecto tendrá dos actores principales:

- **Tendero/comerciante:** administra una tienda, clientes, fiados, pagos y configuración.
- **Cliente/deudor:** consulta de forma segura las deudas que tiene en una o varias tiendas.

---

# 2. Problema que busca resolver

Actualmente muchos pequeños comercios registran sus fiados manualmente en cuadernos.

Problemas:

- Se puede perder o dañar el cuaderno.
- Se pueden olvidar registros.
- Puede haber errores de cálculo.
- No existe un historial digital organizado.
- El comerciante puede no tener computador.
- Algunas tiendas tienen Internet intermitente o no tienen Internet.
- El cliente no tiene una forma sencilla de consultar sus deudas.
- No existe una visión consolidada de las deudas que una persona tiene en diferentes tiendas.

---

# 3. Objetivos

## Objetivo principal

Crear una aplicación móvil sencilla que permita gestionar fiados y pagos de pequeños comercios, funcionando incluso sin conexión a Internet.

## Objetivos específicos

- Registrar tiendas.
- Registrar clientes.
- Registrar fiados.
- Registrar pagos y abonos.
- Mantener historial de movimientos.
- Definir límites de crédito.
- Alertar cuando un cliente alcance o supere su límite.
- Enviar notificaciones por correo cuando el cliente lo autorice.
- Sincronizar automáticamente los datos cuando exista Internet.
- Permitir al cliente consultar sus deudas.
- Mostrar la última fecha/hora de sincronización de cada tienda.
- Mantener separada la información financiera de cada tienda.

---

# 4. Roles

## 4.1 Tendero

Es el usuario que administra la tienda.

Puede:

- Crear y configurar su tienda.
- Administrar clientes.
- Registrar fiados.
- Registrar pagos.
- Consultar saldos.
- Consultar historial.
- Configurar límites.
- Configurar notificaciones.
- Consultar movimientos pendientes de sincronización.
- Sincronizar información.
- Consultar estadísticas y reportes en versiones posteriores.

## 4.2 Cliente/deudor

Puede:

- Consultar sus deudas de forma segura.
- Ver las tiendas donde tiene deudas.
- Ver el total adeudado.
- Ver el saldo individual por tienda.
- Consultar el detalle de movimientos.
- Consultar pagos realizados.
- Ver la última sincronización de cada tienda.

---

# 5. Concepto de cliente global

Una persona podría ser cliente de varias tiendas.

Ejemplo:

**Juan Pérez — documento 123456789**

- Tienda A: $100.000
- Tienda B: $75.000
- Tienda C: $50.000

Total: **$225.000**

Sin embargo, las cuentas de cada tienda deben permanecer completamente separadas.

La aplicación podría relacionar al cliente mediante un identificador global, pero cada tienda mantiene sus propios movimientos y saldos.

## Importante

La consulta global de deudas debe diseñarse teniendo en cuenta privacidad y seguridad.

No debería bastar con introducir un número de documento de cualquier persona para revelar información financiera. Se debe evaluar un mecanismo seguro de autenticación/verificación/autorización para el cliente.

---

# 6. Registro de la tienda

Datos iniciales:

- Nombre de la tienda.
- Nombre del propietario.
- Documento del propietario.
- Teléfono.
- Correo.
- Dirección.
- Ciudad/municipio.
- Logo opcional.

Configuración posterior:

- Datos de la tienda.
- Límites de fiado.
- Notificaciones.
- Configuración de sincronización.
- Otras configuraciones futuras.

---

# 7. Gestión de clientes

Cada tienda tendrá su propia lista de clientes.

Datos:

- Número de documento.
- Nombre.
- Teléfono.
- Correo electrónico.
- Estado de autorización para notificaciones.
- Estado de verificación del correo.
- Límite de fiado personalizado.
- Saldo actual.
- Historial de movimientos.

Búsqueda por:

- Nombre.
- Documento.
- Teléfono.

---

# 8. Registro de fiados

El formulario debe ser extremadamente sencillo para que pueda utilizarlo una persona con poca experiencia tecnológica.

Campos principales:

- Cliente.
- Valor.
- Descripción.
- Fecha y hora automática.

Ejemplo:

Cliente: Juan Pérez

Valor: $50.000

Descripción: Mercado, leche, arroz y huevos

El sistema calcula automáticamente el nuevo saldo.

---

# 9. Registro de pagos

Debe permitir:

- Pago total.
- Abono parcial.

Ejemplo:

Saldo anterior: $200.000

Pago: $50.000

Nuevo saldo: $150.000

El pago también debe tener:

- Fecha.
- Hora.
- Valor.
- Descripción opcional.

---

# 10. Historial de movimientos

Cada cliente debe tener un historial cronológico.

Ejemplo:

24/08/2026 — Fiado — $50.000 — Mercado

23/08/2026 — Pago — -$30.000

22/08/2026 — Fiado — $80.000 — Productos varios

El historial debe permitir reconstruir cómo se obtuvo el saldo actual.

---

# 11. Correcciones y anulaciones

No se recomienda eliminar físicamente movimientos financieros.

En su lugar:

- Anular movimiento.
- Registrar motivo.
- Mantener trazabilidad.

Ejemplo:

Fiado original: $50.000

Estado: ANULADO

Motivo: Registro duplicado

También podría existir una funcionalidad para corregir información manteniendo el historial del cambio.

---

# 12. Límites de fiado

La tienda podrá establecer un límite general de fiado.

Ejemplo:

**Límite predeterminado: $100.000**

Cada cliente podrá:

- Utilizar el límite general.
- Tener un límite personalizado.

Ejemplo:

Juan: límite $100.000

Pedro: límite $200.000

María: límite $50.000

---

# 13. Alertas de límite

Cuando un nuevo fiado provoque que el cliente alcance o supere el límite, la aplicación debe advertir al tendero.

Ejemplo:

Deuda actual: $95.000

Nuevo fiado: $20.000

Nuevo saldo: $115.000

Límite: $100.000

Mostrar:

**Límite de fiado superado.**

Posibles políticas configurables:

1. Solo advertir.
2. Solicitar confirmación del tendero.
3. Bloquear nuevos fiados al superar el límite.

---

# 14. Posible límite de advertencia y límite máximo

Como evolución de la función anterior:

- Límite de advertencia: $100.000.
- Límite máximo: $150.000.

Al alcanzar $100.000 se genera una alerta.

Al alcanzar $150.000 puede requerirse autorización o bloquearse el nuevo fiado.

Esto debe evaluarse para el MVP o una versión posterior.

---

# 15. Notificaciones por correo

Al crear un cliente se podrá registrar un correo.

El cliente debe indicar si acepta recibir notificaciones.

Opciones:

- Notificaciones activadas.
- Notificaciones desactivadas.

Si acepta, se debe verificar el correo mediante un código OTP.

Flujo:

1. Cliente introduce correo.
2. Se solicita autorización.
3. Se envía código OTP.
4. Cliente introduce el código.
5. Correo queda verificado.
6. Se habilitan las notificaciones.

---

# 16. Eventos que pueden generar correos

Cuando estén autorizadas:

## Nuevo fiado

Datos:

- Tienda.
- Fecha.
- Hora.
- Valor.
- Descripción.
- Saldo registrado después del movimiento.

## Pago

Datos:

- Tienda.
- Fecha.
- Hora.
- Valor pagado.
- Saldo anterior.
- Nuevo saldo.

Las notificaciones deben respetar siempre la autorización del cliente.

---

# 17. Funcionamiento offline

Esta es una característica fundamental del proyecto.

La aplicación debe poder:

- Consultar clientes almacenados localmente.
- Crear clientes.
- Registrar fiados.
- Registrar pagos.
- Consultar historial.
- Consultar límites.
- Mostrar información disponible aunque no exista Internet.

Las operaciones se almacenan primero en el dispositivo.

Cuando exista conexión se sincronizan con el backend.

---

# 18. Cola de sincronización

Cada operación local debe tener un estado.

Ejemplo:

PENDIENTE → ENVIANDO → SINCRONIZADO

Si no hay Internet:

**PENDIENTE**

Cuando vuelva Internet:

**ENVIANDO**

Después:

**SINCRONIZADO**

Si ocurre un error, se debe poder reintentar sin duplicar movimientos.

La arquitectura debe contemplar especialmente:

- Idempotencia.
- Reintentos.
- Resolución de conflictos.
- Identificadores únicos generados localmente.
- Orden de operaciones.
- Integridad de saldos.

---

# 19. Sincronización y notificaciones

Ejemplo:

El tendero permanece tres días sin Internet.

Durante ese periodo registra:

- Fiado $20.000.
- Fiado $30.000.
- Pago $10.000.

Todo queda almacenado localmente.

Cuando vuelve Internet:

1. La aplicación detecta conexión.
2. Envía los movimientos pendientes.
3. El backend confirma cada operación.
4. Los movimientos quedan sincronizados.
5. Se actualiza la última sincronización.
6. Se procesan las notificaciones pendientes.
7. El cliente recibe los correos correspondientes si tiene las notificaciones activadas.

---

# 20. Última sincronización

Esta información debe mostrarse claramente.

Ejemplo:

**Saldo registrado: $100.000**

**Última sincronización: 24/08/2026 10:30 AM**

Debe aclararse que el saldo corresponde a la última información sincronizada.

Esto es importante porque una tienda podría haber registrado nuevas operaciones offline después de esa fecha.

---

# 21. Dashboard del tendero

Pantalla inicial propuesta:

- Nombre de la tienda.
- Deuda total.
- Clientes con deuda.
- Deudas vencidas.
- Límites superados.
- Movimientos pendientes.
- Última sincronización.

Acciones principales:

- Nuevo fiado.
- Registrar pago.
- Clientes.
- Sincronizar.

La interfaz debe priorizar botones grandes y flujos sencillos.

---

# 22. Pantallas del tendero — MVP

## Autenticación

1. Iniciar sesión.
2. Crear cuenta.
3. Recuperar contraseña.

## Tienda

4. Crear tienda.
5. Información de la tienda.
6. Configuración.

## Clientes

7. Lista de clientes.
8. Buscar cliente.
9. Crear cliente.
10. Editar cliente.
11. Perfil del cliente.

## Movimientos

12. Nuevo fiado.
13. Registrar pago.
14. Historial.
15. Detalle de movimiento.

## Sincronización

16. Estado de sincronización.
17. Movimientos pendientes.
18. Última sincronización.

## Notificaciones

19. Configuración.
20. Verificación de correo.

---

# 23. Pantallas del cliente — MVP

Posible flujo:

## Consulta segura

- Identificación/autenticación del cliente.
- Consulta de sus deudas.

## Resumen

Mostrar:

- Total de deuda.
- Número de tiendas.
- Deuda por tienda.
- Última sincronización de cada tienda.

## Detalle

Para cada tienda:

- Saldo.
- Movimientos.
- Fiados.
- Pagos.
- Fechas.
- Última sincronización.

---

# 24. Funciones adicionales para versión 2

Estas funciones no deberían necesariamente formar parte del primer MVP:

- Fechas límite de pago.
- Recordatorios.
- Estados de deuda.
- Deudas vencidas.
- Reportes.
- Estadísticas.
- Exportar a PDF/CSV/Excel.
- Dashboard avanzado.
- Varios empleados por tienda.
- Roles y permisos.
- Auditoría.
- Varias tiendas por propietario.
- Copias de seguridad visibles para el usuario.
- Notificaciones dentro de la aplicación.

---

# 25. Funciones potenciales para versión 3

- Cuenta completa del cliente.
- Estadísticas avanzadas.
- Funciones avanzadas de crédito.
- Integraciones externas.
- Más canales de notificación.
- Funciones empresariales.
- Posibles planes de pago/suscripción.

---

# 26. Arquitectura conceptual

Propuesta inicial:

```text
                 ┌──────────────────────────┐
                 │       APP MÓVIL          │
                 │                          │
                 │  UI                      │
                 │  Lógica de negocio      │
                 │  Base de datos local     │
                 │  Cola de sincronización  │
                 └────────────┬─────────────┘
                              │
                         Internet
                              │
                              ▼
                 ┌──────────────────────────┐
                 │        BACKEND           │
                 │                          │
                 │ REST API                 │
                 │ Autenticación            │
                 │ Autorización             │
                 │ Sincronización           │
                 │ Reglas de negocio        │
                 │ Notificaciones            │
                 └────────────┬─────────────┘
                              │
                 ┌────────────┼────────────┐
                 ▼            ▼            ▼
             Base de       Servicio      Servicio
              datos        de correo   autenticación
```

---

# 27. Tecnologías a evaluar

El desarrollador ya tiene experiencia principalmente con:

- Java.
- Spring Boot.
- SQL Server.
- MongoDB.
- Docker.
- Git.
- Jenkins.
- Angular.

Por lo tanto, se deben evaluar alternativas buscando aprovechar conocimientos existentes, pero sin asumir que son necesariamente las mejores para el proyecto.

## Frontend móvil

Evaluar:

- Flutter.
- React Native.
- Android nativo.
- Otras alternativas relevantes.

Criterios:

- Soporte offline-first.
- Base de datos local.
- Sincronización.
- Rendimiento.
- Mantenimiento.
- Multiplataforma.
- Facilidad de desarrollo.
- Ecosistema.
- Experiencia del desarrollador.

## Backend

Evaluar:

- Java + Spring Boot.
- Node.js/NestJS.
- Otros frameworks relevantes.

Criterios:

- Experiencia previa.
- Escalabilidad.
- Seguridad.
- Soporte de sincronización.
- Arquitectura REST/API.
- Mantenimiento.

## Base de datos servidor

Evaluar:

- PostgreSQL.
- SQL Server.
- MySQL.
- MongoDB.
- Arquitectura híbrida si fuera necesario.

La base de datos debe soportar:

- Relaciones entre tiendas y clientes.
- Movimientos financieros.
- Auditoría.
- Sincronización.
- Integridad.
- Consultas eficientes.

## Base de datos local

Evaluar:

- SQLite.
- Isar.
- Drift.
- Room.
- Realm.
- Otra alternativa apropiada según el framework móvil elegido.

Debe soportar correctamente el enfoque offline-first.

---

# 28. Requisitos técnicos críticos

Antes de elegir tecnologías se debe analizar especialmente:

### Offline-first

La aplicación debe funcionar correctamente sin conexión.

### Sincronización

Debe evitar:

- Duplicación.
- Pérdida de datos.
- Movimientos fuera de orden.
- Inconsistencias.

### Idempotencia

Si una operación se envía dos veces, el servidor no debe duplicarla.

### Conflictos

Debe existir una estrategia para resolver cambios realizados desde diferentes dispositivos o sesiones.

### Seguridad

Se debe proteger:

- Información personal.
- Documentos.
- Correos.
- Teléfonos.
- Información financiera.
- Credenciales.

### Privacidad

La consulta de deudas globales requiere especial cuidado porque se trata de información financiera personal.

### Escalabilidad

La arquitectura debe permitir comenzar con pocos usuarios y crecer posteriormente.

---

# 29. Modelo conceptual inicial de datos

Entidades potenciales:

```text
Usuario
  └── Tienda

Tienda
  ├── Clientes
  ├── Configuración
  └── Movimientos

Cliente
  ├── Datos personales
  ├── Configuración de notificaciones
  └── Relación con tiendas

ClienteTienda
  ├── Cliente
  ├── Tienda
  ├── Límite de crédito
  └── Saldo

Movimiento
  ├── Tipo: FIADO / PAGO / AJUSTE / ANULACIÓN
  ├── Valor
  ├── Fecha
  ├── Descripción
  ├── Estado de sincronización
  └── Auditoría

Notificación
  ├── Tipo
  ├── Estado
  ├── Fecha
  └── Destinatario
```

El modelo definitivo debe definirse después de analizar la estrategia de sincronización.

---

# 30. MVP propuesto

La primera versión debería centrarse en:

### Tendero

- Registro/login.
- Crear tienda.
- Registrar clientes.
- Registrar fiados.
- Registrar pagos.
- Historial.
- Límite general de fiado.
- Límite personalizado.
- Alertas de límite.
- Funcionamiento offline.
- Sincronización.
- Última sincronización.
- Verificación de correo.
- Notificaciones por correo.

### Cliente

- Mecanismo seguro de identificación.
- Consultar deudas.
- Ver deudas por tienda.
- Ver total.
- Ver detalle.
- Ver última sincronización.

---

# 31. Preguntas abiertas para definir antes del desarrollo

1. ¿El número de documento será el identificador global del cliente?
2. ¿Cómo se autenticará el cliente?
3. ¿Cómo se evitará que una persona consulte las deudas de otra?
4. ¿El cliente podrá crear su propia cuenta?
5. ¿Qué ocurre si dos tiendas registran datos diferentes para el mismo cliente?
6. ¿Quién puede modificar los datos personales del cliente?
7. ¿Cómo se resolverán conflictos de sincronización?
8. ¿Qué ocurre si dos dispositivos de una misma tienda registran movimientos offline?
9. ¿Se permitirá más de un dispositivo por tienda?
10. ¿Se permitirá más de un empleado?
11. ¿Cómo se recuperarán los datos si el celular se pierde?
12. ¿Qué información se almacena cifrada localmente?
13. ¿Qué política de retención/eliminación de datos se utilizará?
14. ¿Qué proveedor de correo se utilizará?
15. ¿Cómo se manejarán los correos pendientes cuando no haya Internet?
16. ¿Qué estrategia se utilizará para generar identificadores offline?
17. ¿Cómo se calcularán y validarán los saldos?
18. ¿Cómo se manejarán anulaciones y correcciones?
19. ¿Qué ocurre cuando una tienda elimina un cliente?
20. ¿Cómo se manejará la relación entre cliente global y cliente de una tienda?

---

# 32. Objetivo de la discusión tecnológica

La siguiente etapa del proyecto es comparar las tecnologías disponibles para:

- Frontend móvil.
- Backend.
- Base de datos principal.
- Base de datos local.
- Sincronización offline/online.
- Autenticación.
- Envío de correos.
- Notificaciones.
- Hosting/cloud.
- CI/CD.
- Seguridad.
- Observabilidad.
- Pruebas.

La selección tecnológica debe hacerse considerando:

1. Requisitos del proyecto.
2. Complejidad del offline-first.
3. Facilidad de sincronización.
4. Experiencia previa del desarrollador.
5. Costos.
6. Escalabilidad.
7. Mantenimiento.
8. Seguridad.
9. Tiempo necesario para desarrollar el MVP.

---

# 33. Visión del producto

La visión inicial es crear una aplicación que pueda reemplazar el cuaderno de fiados de una tienda sin obligar al comerciante a tener computador o Internet permanente.

La experiencia debe ser:

**Simple para el tendero + segura para el cliente + resistente a la falta de Internet.**

El diferencial técnico principal será el enfoque **offline-first**, mientras que el diferencial funcional será permitir que un cliente pueda consultar de manera segura sus obligaciones en diferentes tiendas sin mezclar la información de cada comercio.

---

# 34. Arquitectura y Stack Tecnológico Seleccionado

Se ha definido la siguiente arquitectura técnica oficial para el desarrollo del **Gestor Digital de Fiados**:

## 34.1 Resumen del Stack

* **Frontend Móvil (App):** React Native con Expo (TypeScript)
* **Base de Datos Local (Offline):** `expo-sqlite` (SQLite nativo en el celular)
* **Generación de IDs Offline:** `expo-crypto` (`UUID v4`)
* **Detector de Conexión:** `@react-native-community/netinfo`
* **Almacenamiento Cifrado:** `expo-secure-store`
* **Backend (API REST):** Java 17+ / Spring Boot 3+ (Spring Data JPA, Spring Security, Spring Mail)
* **Base de Datos Servidor:** MySQL (Desplegado en Dokploy)
* **Gestor de Base de Datos:** Adminer (Desplegado en Dokploy)
* **Infraestructura de Despliegue:** Dokploy + Docker Containers

---

## 34.2 Estructura del Proyecto

El repositorio estará estructurado en dos módulos principales:

```text
fiados-app/
├── mobile/                            # Aplicación Móvil en React Native + Expo
│   ├── src/
│   │   ├── core/                      # Infraestructura Offline & Sync
│   │   │   ├── database/              # expo-sqlite, esquemas y migraciones
│   │   │   ├── sync/                  # Outbox Queue, sincronizador idempotente
│   │   │   ├── network/               # Axios client e Interceptores
│   │   │   └── security/              # Storage cifrado para JWT
│   │   ├── modules/                   # Módulos Funcionales
│   │   │   ├── auth/                  # Login Tendero, OTP Cliente
│   │   │   ├── store/                 # Gestión de Tienda
│   │   │   ├── customers/             # Gestión de Clientes y Límites de Crédito
│   │   │   ├── transactions/          # Fiados, Abonos/Pagos, Anulaciones
│   │   │   └── client_portal/         # Portal de Consulta para Clientes
│   │   ├── shared/                    # UI Components (React Native Paper / NativeWind)
│   │   └── app.json / eas.json        # Configuración Expo & EAS Build (APK)
│   └── package.json
│
└── backend/                           # API REST en Spring Boot
    ├── src/main/java/com/fiados/
    │   ├── domain/                    # Entidades (Store, Customer, Transaction, User)
    │   ├── repository/                # Repositorios JPA
    │   ├── sync/                      # Controller y Service /api/v1/sync (Idempotente)
    │   ├── notification/              # Servicio de correo OTP y transaccional
    │   └── security/                  # Spring Security + JWT
    ├── src/main/resources/
    │   └── application.yml            # Configuración MySQL & SMTP
    ├── Dockerfile                     # Construcción para Dokploy
    └── pom.xml
```

---

## 34.3 Estrategia de Sincronización Offline-First

1. **Escritura Inmediata:** Toda operación de fiado o pago se registra inmediatamente en la base de datos `expo-sqlite` del celular asignando un `UUID v4` único y estado `PENDING`.
2. **Respuesta Inmediata UI:** El saldo del cliente se recalcula en tiempo real en la UI local sin esperar respuesta del servidor.
3. **Outbox Queue & Sync Engine:** 
   - Cuando `@react-native-community/netinfo` detecta conexión, se activa el motor de sincronización.
   - Envía el lote de transacciones pendientes a `POST /api/v1/sync` en el servidor Spring Boot.
4. **Idempotencia en Servidor:**
   - Spring Boot verifica si el `UUID` del movimiento ya existe en la base de datos MySQL.
   - Si no existe, lo guarda, recalcula el saldo en MySQL y procesa las notificaciones OTP por correo.
   - Si ya existe, omite el duplicado y responde `200 OK` confirmando la recepción.
5. **Confirmación Local:** El móvil cambia el estado del movimiento en `expo-sqlite` a `SYNCED`.

