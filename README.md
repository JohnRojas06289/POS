# NEXUS POS

Sistema de punto de venta multi-tenant para negocios colombianos. Construido como monorepo con NestJS (backend), Next.js 14 (web), React Native (mobile) y PostgreSQL schema-per-tenant.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | NestJS 10, Prisma ORM, JWT (access + refresh), bcrypt |
| Base de datos | PostgreSQL 16 en Neon, schema-per-tenant |
| Caché / tokens | Redis 7 con fallback en memoria si no está disponible |
| Frontend web | Next.js 14 App Router, React 18, Zustand, TanStack Query v5 |
| Frontend mobile | React Native (Expo), SQLite local, sync offline |
| Estilos | Tailwind CSS + Design tokens (CSS custom properties), 5 temas visuales |
| Imágenes | Cloudinary (upload de productos) |
| Monorepo | Turborepo + pnpm workspaces |
| Deploy | Vercel (web) + Render (backend) + Neon (PostgreSQL) |

---

## Módulos implementados

### Backend (`/backend`)

| Módulo | Endpoints principales |
|--------|-----------------------|
| **Auth** | `POST /auth/register-tenant`, `POST /auth/login`, `POST /auth/login-pin`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/request-password-reset`, `POST /auth/reset-password` |
| **Tenants** | `GET /tenants/config`, `PATCH /tenants/config`, `GET /tenants/branches`, `POST /tenants/branches`, `GET /tenants/users`, `POST /tenants/users`, `GET /tenants/terminals`, `POST /tenants/terminals`, `PATCH /tenants/terminals/:id/block` |
| **POS** | `POST /pos/orders`, `GET /pos/orders`, `GET /pos/orders/:id`, `PATCH /pos/orders/:id/hold`, `PATCH /pos/orders/:id/resume`, `POST /pos/orders/:id/refund` |
| **Inventory** | `GET /inventory/products`, `PATCH /inventory/products/:id`, `POST /inventory/stock/receive`, `POST /inventory/stock/adjust`, `GET /inventory/stock/:variantId/kardex`, `GET /inventory/stock/low` |
| **Customers** | `GET /customers`, `GET /customers/:id`, `POST /customers/:id/credit/payment` |
| **Analytics** | `GET /analytics/sales/summary`, `GET /analytics/products/performance`, `GET /analytics/inventory/valuation`, `GET /analytics/customers/insights` |
| **Employees** | `GET /employees`, `POST /employees`, `POST /employees/:id/payments`, `GET /employees/payroll/summary` |
| **Expenses** | `GET /expenses`, `POST /expenses`, `GET /expenses/summary` |
| **Suppliers** | `GET /suppliers`, `POST /suppliers`, `GET /suppliers/:id/purchase-orders`, `POST /suppliers/:id/purchase-orders`, `PATCH /suppliers/:id/purchase-orders/:orderId/receive` |
| **Cash** | `POST /cash/sessions/open`, `GET /cash/sessions/current`, `POST /cash/sessions/:id/close` |
| **Billing** | `GET /billing/plans`, `GET /billing/subscription` |
| **Sync** | `POST /sync/push`, `POST /sync/pull` |
| **DIAN** | Base implementada |
| **Onboarding** | Wizard de activación de tenant con plantillas por tipo de negocio |

### Frontend web (`/apps/web`)

**Rutas públicas**
| Ruta | Descripción |
|------|-------------|
| `/` | Landing page — presentación del producto, módulos, planes y CTAs |
| `/login` | Autenticación con email/contraseña o PIN de cajero |
| `/register` | Alias del wizard de onboarding |
| `/onboarding` | Wizard de registro (4 pasos: plan → negocio → cuenta → confirmar) |
| `/onboarding/success` | Confirmación de registro exitoso |
| `/forgot-password` | Solicitud de enlace de recuperación de contraseña |
| `/reset-password` | Formulario para nueva contraseña con token |

**Dashboard** (`/(dashboard)`) — requiere autenticación
| Ruta | Descripción |
|------|-------------|
| `/dashboard` | KPIs (ventas, órdenes, clientes), gráfica de ventas 7 días, órdenes recientes |
| `/inventory` | Productos con variantes, stock, kardex paginado, recepción de stock, edición con imagen |
| `/customers` | Lista de clientes, crédito pendiente, modal nuevo cliente, modal registrar abono |
| `/orders` | Historial de órdenes |
| `/analytics` | Ventas, mix de pago, top productos, clientes, margen estimado |
| `/employees` | Lista de empleados, registro de pagos, resumen de nómina |
| `/expenses` | Gastos por categoría con filtros de fecha y gráfica de distribución |
| `/suppliers` | Proveedores, órdenes de compra, recepción de mercancía |
| `/settings` | Configuración del tenant, usuarios, sucursales, terminales |
| `/profile` | Perfil del usuario autenticado |

**POS** (`/(pos)`)
| Ruta | Descripción |
|------|-------------|
| `/pos` | Punto de venta completo: búsqueda, carrito, descuentos, carrito retenido (F3), lector de código de barras, modo consulta de precios |

### Frontend mobile (`/apps/mobile`)

App React Native (Expo) con operación offline-first:
- Login con email/contraseña y PIN de cajero
- SQLite local para operar sin conexión
- Hook `useOfflinePOS` para sincronización diferida con el backend

---

## Arquitectura multi-tenant

Cada negocio registrado obtiene un schema propio en PostgreSQL:

```
PostgreSQL (Neon)
├── public              ← schema global (Tenant, Plan, BusinessTemplate, etc.)
└── tenant_{slug}_{uid} ← schema por negocio (generado en registro)
    ├── Branch
    ├── Terminal
    ├── User
    ├── Product / ProductVariant / StockEntry
    ├── Order / OrderItem / Payment
    ├── Customer / CreditTransaction
    ├── Employee / PayrollPayment
    ├── Expense
    ├── Supplier / PurchaseOrder
    └── ... (23 tablas clonadas del schema "tenant" template)
```

El schema se provisiona automáticamente en `POST /auth/register-tenant`. El `TenantInterceptor` verifica el JWT en cada request autenticado y expone `request.user` con `tenantId`, `schemaName` y `role`. Todos los servicios usan nombres de schema explícitos en sus queries (`"${schemaName}"."Tabla"`).

---

## Correr localmente

### Requisitos

- Node.js >= 20
- pnpm >= 9
- Docker (para PostgreSQL y Redis locales)
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

Levanta:
- PostgreSQL 16 en `localhost:5432` (usuario: `postgres`, contraseña: `postgres`, db: `nexus_global`)
- Redis 7 en `localhost:6379`

### 3. Configurar el backend

```bash
cp backend/.env.example backend/.env
```

Edita `backend/.env` con los valores mínimos para desarrollo local:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nexus_global"
JWT_SECRET="cambia-esto-por-algo-random"
JWT_REFRESH_SECRET="cambia-esto-tambien"
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="30d"
REDIS_HOST="localhost"
REDIS_PORT="6379"
NODE_ENV="development"
PORT="3001"
ALLOWED_ORIGINS="http://localhost:3000"
```

> Redis es opcional. Si no está disponible, el backend usa un Map en memoria con soporte de TTL. Las sesiones no persisten entre reinicios del servidor en ese modo.

### 4. Sincronizar el schema de base de datos

```bash
cd backend
pnpm prisma:push
```

### 5. Cargar datos de demo

```bash
pnpm seed
```

Crea:
- Schema `tenant_demo` con todas las tablas
- Tenant demo: email `demo@nexus.com`
- Usuario demo: `demo@nexus.com` / `demo1234`
- Productos, clientes y órdenes de ejemplo

### 6. Configurar el frontend

```bash
cp apps/web/.env.example apps/web/.env.local
```

Edita `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
# Opcional: necesario para subida de imágenes de productos
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=tu-upload-preset
```

### 7. Correr en desarrollo

```bash
# Desde la raíz del monorepo (backend + frontend en paralelo)
pnpm dev

# O por separado
cd backend && pnpm dev     # http://localhost:3001
cd apps/web && pnpm dev    # http://localhost:3000
```

---

## Credenciales de demo

| Campo | Valor |
|-------|-------|
| Email del negocio | `demo@nexus.com` |
| Email del usuario | `demo@nexus.com` |
| Contraseña | `demo1234` |

---

## Variables de entorno

### Backend

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `DATABASE_URL` | Conexión a PostgreSQL | Sí |
| `JWT_SECRET` | Secreto para access tokens | Sí |
| `JWT_REFRESH_SECRET` | Secreto para refresh tokens | Sí |
| `JWT_ACCESS_EXPIRES` | Duración del access token (ej. `15m`) | No (default: `15m`) |
| `JWT_REFRESH_EXPIRES` | Duración del refresh token (ej. `30d`) | No (default: `30d`) |
| `REDIS_HOST` | Host de Redis | No (default: `localhost`) |
| `REDIS_PORT` | Puerto de Redis | No (default: `6379`) |
| `ALLOWED_ORIGINS` | Orígenes CORS permitidos, separados por coma | No (default: `http://localhost:3000`) |
| `PORT` | Puerto del servidor | No (default: `3001`) |
| `NODE_ENV` | `development` o `production` | No |
| `RESEND_API_KEY` | API key de Resend para emails de recuperación | No |
| `EMAIL_FROM` | Dirección remitente de emails | No |
| `CLOUDINARY_CLOUD_NAME` | Cloud name de Cloudinary | No |
| `WOMPI_PUBLIC_KEY` / `WOMPI_PRIVATE_KEY` | Claves de pasarela de pagos Wompi | No |

### Frontend web

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `NEXT_PUBLIC_API_URL` | URL base del backend | Sí |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloud name de Cloudinary | Solo si se usan imágenes de productos |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Upload preset sin firma de Cloudinary | Solo si se usan imágenes de productos |

---

## Scripts útiles

```bash
# Raíz del monorepo
pnpm dev          # Backend + frontend en paralelo
pnpm build        # Build de todos los paquetes
pnpm lint         # Lint en todos los paquetes

# Backend (cd backend)
pnpm dev               # NestJS en modo watch
pnpm build             # Build de producción
pnpm prisma:push       # Sincronizar schema con la DB (sin migraciones)
pnpm prisma:migrate    # Crear migración nueva
pnpm prisma:generate   # Regenerar el cliente de Prisma
pnpm prisma:studio     # Abrir Prisma Studio en el navegador
pnpm seed              # Cargar datos de demo

# Frontend web (cd apps/web)
pnpm dev           # Next.js en modo desarrollo
pnpm build         # Build de producción
```

---

## Estructura del monorepo

```
nexus/
├── apps/
│   ├── web/                        # Next.js 14 App Router
│   │   └── src/
│   │       ├── app/
│   │       │   ├── page.tsx        # Landing page (/)
│   │       │   ├── (auth)/         # Login, register, forgot/reset-password
│   │       │   ├── (dashboard)/    # Dashboard, inventory, customers, analytics,
│   │       │   │                   # employees, expenses, suppliers, settings, orders
│   │       │   ├── (pos)/          # Punto de venta (/pos)
│   │       │   └── onboarding/     # Wizard de registro
│   │       ├── components/
│   │       │   ├── onboarding/     # StepPlans, StepBusiness, StepAccount,
│   │       │   │                   # StepConfirm, StepPayment
│   │       │   └── ui/             # Card, Badge, Button, Toast, Skeleton,
│   │       │                       # KPICard, ThemeToggle, ImageUpload
│   │       ├── stores/             # Zustand (auth.store.ts)
│   │       ├── lib/                # api.ts (axios + interceptors), cn.ts, themes.ts
│   │       └── styles/             # tokens.css (design system, 5 temas)
│   └── mobile/                     # React Native (Expo)
│       └── src/
│           ├── database/           # local.db.ts (SQLite)
│           ├── hooks/              # useOfflinePOS.ts
│           └── app/
│               └── (auth)/         # Login, PIN login
├── backend/
│   └── src/
│       ├── modules/
│       │   ├── auth/               # JWT, register-tenant, login, password reset
│       │   ├── analytics/          # KPIs y reportes
│       │   ├── inventory/          # Productos, variantes, stock, kardex
│       │   ├── pos/                # Sesiones de caja y órdenes
│       │   ├── customers/          # Clientes y crédito
│       │   ├── employees/          # Empleados y nómina
│       │   ├── expenses/           # Gastos por categoría
│       │   ├── suppliers/          # Proveedores y órdenes de compra
│       │   ├── cash/               # Sesiones de caja
│       │   ├── billing/            # Planes y suscripciones
│       │   ├── tenants/            # Config, usuarios, sucursales, terminales
│       │   ├── sync/               # Push/pull para sincronización offline
│       │   └── onboarding/         # Wizard de activación con plantillas
│       ├── common/
│       │   ├── interceptors/       # TenantInterceptor (auth + schema context)
│       │   ├── decorators/         # @Public(), @CurrentUser()
│       │   ├── security/           # Rate limiting, hardening
│       │   └── utils/              # tenant-schema.util.ts, resilience.util.ts
│       └── database/
│           ├── prisma/             # schema.prisma, seed.ts
│           └── redis/              # RedisService (con fallback en memoria)
├── docker-compose.yml              # PostgreSQL 16 + Redis 7
├── turbo.json                      # Pipeline de Turborepo
└── vercel.json                     # Config de deploy para Vercel
```

---

## Diseño

- **Design system**: tokens CSS en `styles/tokens.css` — paleta dorada (`--gold-*`), fondos (`--bg-*`), textos (`--text-*`), bordes, sombras y radios.
- **Temas**: 5 temas visuales (minimal, dark, warm, professional, editorial) seleccionables desde el `ThemeToggle`.
- **Fuentes**: Fraunces (display/headings), DM Sans (cuerpo), JetBrains Mono (datos/código).
- **Redis fallback**: si Redis no está disponible al iniciar, el backend usa un `Map` en memoria con soporte de TTL.
- **Schema-per-tenant**: el schema se genera como `tenant_{slug}_{timestamp_base36}` para garantizar unicidad sin exponer el nombre del negocio en identificadores internos.
- **Imágenes**: upload directo al cliente de Cloudinary con preset sin firma. El backend solo almacena la URL resultante.
