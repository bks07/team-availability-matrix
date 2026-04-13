# Team Availability Matrix – Constitution

## Purpose

The Team Availability Matrix is a web application that enables organizations to maintain a centralized, yearly grid of employee availability. Staff can manage their own availability status for each day.

## Assumptions

1. **Trust Model**: Users are trusted to report their own availability honestly.
2. **Small-to-Medium Scale**: Designed for teams of up to a few hundred users.
3. **First User is Admin**: The first registered user automatically receives all permissions.

## Technology Stack

### Backend

- **Language**: Rust
- **Runtime**: Tokio (async I/O)
- **Web Framework**: Axum (type-safe, composable HTTP server)
- **Database**: PostgreSQL with SQLx (compile-time SQL verification)
- **Authentication**: JWT with Argon2 password hashing
- **Logging**: Tracing with structured output
- **CORS**: Tower-HTTP middleware

Key dependencies:
- `axum` — HTTP routing, middleware, macros
- `tokio` — Async runtime
- `sqlx` — Type-safe SQL query builder
- `serde` — JSON serialization
- `jsonwebtoken` — JWT signing and verification
- `argon2` — Password hashing

### Frontend

- **Language**: TypeScript
- **Framework**: React 18 (function components, hooks)
- **Build Tool**: Vite (fast development and production builds)
- **HTTP Client**: Axios
- **Routing**: React Router v7
- **Image Cropping**: React Easy Crop
- **Testing**: Vitest (unit tests) + Playwright (E2E tests)
- **Testing Utilities**: React Testing Library

Key dependencies:
- `react`, `react-dom` — UI framework
- `react-router-dom` — Client-side routing
- `axios` — HTTP client
- `react-easy-crop` — Image crop widget
- `vitest` — Unit test runner
- `@playwright/test` — Browser automation for E2E

### Architecture

```
┌─────────────────────┐
│   React Frontend    │
│  (TypeScript/Vite)  │
└──────────┬──────────┘
           │ HTTP (JWT auth)
           ↓
┌─────────────────────┐
│  Axum Web Server    │
│    (Rust/Tokio)     │
└──────────┬──────────┘
           │ SQL
           ↓
┌─────────────────────┐
│   PostgreSQL DB     │
│ (Structured Schema) │
└─────────────────────┘
```

### Deployment

- **Backend**: Docker container (Dockerfile included)
- **Frontend**: Nginx static server (Dockerfile + nginx.conf)
- **Compose**: Docker Compose for local development and testing

### Code Quality & Testing

- **Unit Tests**: Vitest (frontend) + Cargo test (backend)
- **E2E Tests**: Playwright (browser automation)
- **Type Safety**: TypeScript (frontend) + Rust (backend)
- **Linting**: Built-in via TypeScript compiler
- **Build Verification**: Type checking required before production builds
