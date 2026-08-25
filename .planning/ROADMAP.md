# Roadmap — Gestor Digital de Fiados

## Milestones

### Milestone 1: Mobile App Setup & Core SQLite Engine (Current)
- [ ] **Phase 1.1:** Initialize Expo project with TypeScript in `mobile/`.
- [ ] **Phase 1.2:** Configure `expo-sqlite`, `expo-crypto`, and SQLite schema & migrations.
- [ ] **Phase 1.3:** Build Outbox Sync Queue & NetInfo network listener service.

### Milestone 2: Tendero Workflows & Offline Features
- [ ] **Phase 2.1:** Store Setup & Configuration UI.
- [ ] **Phase 2.2:** Customer Management (List, Search, Create, Edit, Custom Limits).
- [ ] **Phase 2.3:** Fiados & Payments Entry with Credit Limit Alert Logic.
- [ ] **Phase 2.4:** Chronological History, Balance Details, and Transaction Annulments.

### Milestone 3: Spring Boot Backend & MySQL Dokploy Deployment
- [ ] **Phase 3.1:** Initialize Spring Boot backend in `backend/` with JPA, MySQL connector, & Flyway/Liquibase.
- [ ] **Phase 3.2:** Build `/api/v1/sync` Idempotent Batch Endpoint & Auth (JWT).
- [ ] **Phase 3.3:** Integrate Spring Mail / OTP verification service.
- [ ] **Phase 3.4:** Dockerize backend and deploy to Dokploy connected to MySQL.

### Milestone 4: Integration, Customer Portal & End-to-End Verification
- [ ] **Phase 4.1:** Connect Mobile App Sync Engine to Spring Boot Backend.
- [ ] **Phase 4.2:** Build Customer/Deudor Secure Debt Lookup View.
- [ ] **Phase 4.3:** End-to-End Offline-to-Online E2E Sync Testing & APK Generation via Expo EAS.
