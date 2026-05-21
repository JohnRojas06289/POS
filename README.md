# NEXUS POS

Sistema de punto de venta multi-tenant para negocios colombianos. Construido como monorepo con NestJS (backend), Next.js 14 (web) y PostgreSQL schema-per-tenant.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | NestJS 10, Prisma ORM, JWT (access + refresh), bcrypt |
| Base de datos | PostgreSQL 16, schema-per-tenant |
| Caché | Redis 7 (con fallback en memoria si no está disponible) |
| Frontend web | Next.js 14 App Router, React 18, Zustand, TanStack Query v5 |
| Estilos | Tailwind CSS + Design tokens (CSS custom properties) |
| Monorepo | Turborepo + pnpm workspaces |
| Deploy | Vercel (web) + Railway (backend + postgres) |

---

## Módulos implementados

### Backend (`/backend`)

- **Auth** — registro de tenant (`POST /auth/register-tenant`), login email+contraseña (`POST /auth/login`), login PIN (`POST /auth/login-pin`), refresh token, logout, perfil (`GET /auth/me`)
- **Tenants** — gestión de configuración del tenant, crear usuarios (`POST /tenants/users`), crear sucursales (`POST /tenants/branches`)
- **Analytics** — resumen de ventas, ventas por día, órdenes recientes, ingresos por sucursal (`GET /analytics/summary`)
- **Inventory** — productos con variantes, stock, movimientos
- **POS** — sesiones de caja, órdenes, items, pagos
- **Customers** — CRUD de clientes, crédito, abonos
- **Billing** — planes de suscripción (`GET /billing/plans`)
- **Suppliers, Expenses, Employees, DIAN** — módulos base

### Frontend web (`/apps/web`)

**Rutas públicas**
- `/onboarding` — wizard de registro (4 pasos: plan → negocio → cuenta → confirmar)
- `/login` — autenticación con email y contraseña

**Dashboard** (`/(dashboard)`)
- `/` — KPIs (ventas, órdenes, clientes, ticket promedio) + gráfica de ventas 7 días + órdenes recientes
- `/inventory` — tabla de productos con variantes, modal para crear producto
- `/customers` — lista de clientes, crédito, modal nuevo cliente, modal registrar abono
- `/settings` — configuración del tenant, modal nuevo usuario, modal nueva sucursal

**POS** (`/(pos)`)
- `/pos` — punto de venta completo: búsqueda de productos, carrito, descuentos por ítem y globales, modo consulta de precios, carrito retenido (F3), deshacer (Ctrl+Z), lector de código de barras

---

## Arquitectura multi-tenant

Cada negocio registrado obtiene un schema propio en PostgreSQL:

```
PostgreSQL
├── public          ← schema global (Tenant, Plan, etc.)
└── tenant_{slug}_{uid}  ← schema por negocio
    ├── Branch
    ├── Terminal
    ├── User
    ├── Product / ProductVariant / StockEntry
    ├── Order / OrderItem / Payment
    ├── Customer / CreditTransaction
    └── ... (23 tablas clonadas de "tenant" template)
```

El schema se provisiona automáticamente en `POST /auth/register-tenant` usando `CREATE SCHEMA LIKE "tenant"."<tabla>" INCLUDING ALL`.

---

## Correr localmente

### Requisitos

- Node.js >= 20
- pnpm >= 9
- Docker (para PostgreSQL y Redis) o una instancia de PostgreSQL accesible
- PostgreSQL con extensiones `uuid-ossp` y `pgcrypto`

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url>
cd nexus
pnpm install
```

### 2. Levantar PostgreSQL y Redis con Docker

```bash
docker compose up -d
```

Esto levanta:
- PostgreSQL 16 en `localhost:5432` (usuario: `postgres`, contraseña: `postgres`, db: `nexus_global`)
- Redis 7 en `localhost:6379`

### 3. Configurar el backend

```bash
cp backend/.env.example backend/.env
```

Edita `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nexus_global"
JWT_SECRET="cambia-esto-por-algo-random"
JWT_REFRESH_SECRET="cambia-esto-tambien"
REDIS_URL="redis://localhost:6379"
NODE_ENV=development
```

> **Nota:** Redis es opcional. Si no está disponible, el backend usa un Map en memoria como fallback automático.

### 4. Sincronizar el schema de base de datos

```bash
cd backend
pnpm prisma:push
```

### 5. Cargar datos de demo

```bash
pnpm seed
```

Esto crea:
- Schema `tenant_demo` con todas las tablas
- Usuario demo: **admin@nexus.com** / **Admin123!**
- 2 productos con variantes (SHIRT-001, JEAN-001)
- 2 clientes
- 10 órdenes distribuidas en los últimos 7 días

### 6. Configurar el frontend

```bash
cp apps/web/.env.example apps/web/.env.local
```

Edita `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 7. Correr en desarrollo

Desde la raíz del monorepo:

```bash
pnpm dev
```

Esto corre en paralelo:
- Backend en `http://localhost:3001`
- Frontend en `http://localhost:3000`

O por separado:

```bash
# Backend
cd backend && pnpm dev

# Frontend
cd apps/web && pnpm dev
```

---

## Credenciales de demo

| Campo | Valor |
|-------|-------|
| Email | `admin@nexus.com` |
| Contraseña | `Admin123!` |
| Tenant email | `admin@nexus.com` (mismo) |

---

## Registro de un nuevo negocio

Ir a `/onboarding` o `/register`. El wizard guía en 4 pasos:

1. **Plan** — seleccionar plan de suscripción (cargado desde la API)
2. **Negocio** — tipo de negocio (tarjetas visuales) + nombre + teléfono
3. **Cuenta** — nombre del responsable + email + contraseña con medidor de fortaleza
4. **Confirmar** — resumen + submit a `POST /auth/register-tenant`

Al completar el registro, los tokens JWT se persisten en `localStorage` y en el store de Zustand, y el usuario es redirigido directamente al dashboard.

---

## Variables de entorno

### Backend

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `DATABASE_URL` | Conexión a PostgreSQL | Sí |
| `JWT_SECRET` | Secreto para access tokens | Sí |
| `JWT_REFRESH_SECRET` | Secreto para refresh tokens | Sí |
| `REDIS_URL` | Conexión a Redis | No (fallback en memoria) |
| `NODE_ENV` | `development` o `production` | No |
| `PORT` | Puerto del servidor (default: 3001) | No |

### Frontend

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `NEXT_PUBLIC_API_URL` | URL base del backend | Sí |

---

## Scripts útiles

```bash
# Raíz del monorepo
pnpm dev          # Backend + frontend en paralelo
pnpm build        # Build de todos los paquetes
pnpm lint         # Lint en todos los paquetes
pnpm format       # Prettier en todo el repo

# Backend (cd backend)
pnpm prisma:push   # Sincronizar schema con la DB (sin migraciones)
pnpm prisma:studio # Abrir Prisma Studio en el navegador
pnpm seed          # Cargar datos de demo
pnpm dev           # Nest en modo watch

# Frontend (cd apps/web)
pnpm dev           # Next.js en modo desarrollo
pnpm build         # Build de producción
```

---

## Estructura del monorepo

```
nexus/
├── apps/
│   └── web/                    # Next.js 14 App Router
│       └── src/
│           ├── app/
│           │   ├── (auth)/     # Login, register
│           │   ├── (dashboard)/# Dashboard, inventory, customers, settings
│           │   ├── (pos)/      # Punto de venta
│           │   └── onboarding/ # Wizard de registro
│           ├── components/
│           │   ├── onboarding/ # StepPlans, StepBusiness, StepAccount, StepConfirm
│           │   └── ui/         # Toast, ThemeToggle, etc.
│           ├── stores/         # Zustand (auth.store.ts)
│           ├── lib/            # api.ts (axios), cn.ts
│           └── styles/         # tokens.css (design system)
├── backend/
│   └── src/
│       ├── modules/
│       │   ├── auth/           # JWT, register-tenant, login
│       │   ├── analytics/      # KPIs y reportes
│       │   ├── inventory/      # Productos y stock
│       │   ├── pos/            # Sesiones de caja y órdenes
│       │   ├── customers/      # Clientes y crédito
│       │   ├── billing/        # Planes
│       │   └── tenants/        # Config del tenant, usuarios, sucursales
│       ├── common/
│       │   └── utils/          # tenant-schema.util.ts (TENANT_TEMPLATE_TABLES)
│       └── database/
│           ├── prisma/         # schema.prisma, seed.ts
│           └── redis/          # RedisService (con fallback en memoria)
├── docker/
│   └── postgres/init.sql       # Extensiones uuid-ossp, pgcrypto
├── docker-compose.yml          # PostgreSQL + Redis
└── turbo.json                  # Pipeline de Turborepo
```

---

## Notas de diseño

- **Design system**: tokens CSS en `styles/tokens.css` — paleta dorada (`--gold-*`), fondos (`--bg-*`), texto (`--text-*`), bordes (`--border-*`), sombras, radios.
- **Tema oscuro**: soportado vía `[data-theme="dark"]` en tokens.css.
- **Fuentes**: Fraunces (display/headings), DM Sans (cuerpo), JetBrains Mono (datos/código).
- **Redis fallback**: si Redis no está disponible al iniciar, el backend registra una advertencia y usa un `Map` en memoria con soporte de TTL. Las sesiones no persisten entre reinicios del servidor en este modo.
- **Schema-per-tenant**: el schema se genera como `tenant_{slug}_{timestamp_base36}` para garantizar unicidad sin exponer el nombre del negocio en identificadores internos.
