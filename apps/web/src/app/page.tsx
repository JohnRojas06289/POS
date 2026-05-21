import Link from 'next/link';
import { ArrowRight, BarChart3, Boxes, CheckCircle2, CloudOff, LayoutGrid, ShieldCheck, Store, Zap } from 'lucide-react';
import { cn } from '../lib/cn';

export const metadata = {
  title: 'NEXUS POS — El POS que tu negocio merece',
  description: 'Punto de venta premium para negocios colombianos. Ventas, inventario, analíticas y operación offline desde una sola plataforma.',
};

const BUSINESS_TYPES = [
  'Tienda de ropa', 'Supermercado', 'Restaurante', 'Farmacia',
  'Ferretería', 'Salón de belleza', 'Cafetería', 'Papelería',
  'Droguería', 'Distribuidora', 'Minimarket', 'Librería',
  'Miscelánea', 'Panadería', 'Zapatería', 'Electrónica',
];

const PLANS = [
  {
    name: 'Lite',
    badge: null as string | null,
    price: 'Pago único',
    description: 'Para empezar sin mensualidades.',
    features: ['1 sucursal', '1 usuario admin', 'POS completo', 'Inventario básico', 'Soporte por email'],
    cta: { label: 'Empezar', href: '/register' },
    highlight: false,
  },
  {
    name: 'Starter',
    badge: 'Más popular' as string | null,
    price: 'Mensual',
    description: 'Para negocios con equipo y crecimiento.',
    features: ['3 sucursales', '5 usuarios', 'POS + inventario', 'Analíticas avanzadas', 'Roles y permisos', 'Soporte prioritario'],
    cta: { label: 'Elegir Starter', href: '/register' },
    highlight: true,
  },
  {
    name: 'Pro',
    badge: null as string | null,
    price: 'Mensual',
    description: 'Para operaciones grandes y exigentes.',
    features: ['Sucursales ilimitadas', 'Usuarios ilimitados', 'Todo de Starter', 'Integración DIAN', 'API access', 'SLA 99.9%'],
    cta: { label: 'Hablar con ventas', href: '/register' },
    highlight: false,
  },
];

function POSMock() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111111] p-5 shadow-[0_40px_80px_rgba(0,0,0,0.7)]">
      <div className="mb-4 flex items-center justify-between border-b border-white/8 pb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">Caja principal</p>
          <p className="mt-1 text-xl font-medium text-white" style={{ fontFamily: 'var(--font-display)' }}>Turno activo</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-[11px] font-medium text-emerald-400">En línea</span>
        </div>
      </div>

      <div className="space-y-2">
        {[
          { name: 'Camiseta básica talla M', qty: 2, price: '$45.000' },
          { name: 'Jean slim fit 32', qty: 1, price: '$89.900' },
          { name: 'Cinturón cuero café', qty: 1, price: '$32.000' },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-[rgba(201,168,76,0.15)] text-[11px] font-bold text-[#C9A84C]">
                {item.qty}
              </div>
              <p className="truncate text-[13px] text-white/75">{item.name}</p>
            </div>
            <p className="ml-3 flex-none text-[13px] font-semibold text-white">{item.price}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-[rgba(201,168,76,0.22)] bg-[rgba(201,168,76,0.07)] px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/50">Total a cobrar</p>
          <p className="text-2xl font-bold text-[#C9A84C]" style={{ fontFamily: 'var(--font-mono)' }}>$166.900</p>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {['Efectivo', 'Tarjeta', 'Transferencia'].map((m, i) => (
            <div
              key={m}
              className={cn(
                'rounded-lg py-2 text-center text-[12px] font-medium transition-colors',
                i === 0
                  ? 'bg-[rgba(201,168,76,0.2)] text-[#C9A84C]'
                  : 'bg-white/5 text-white/40',
              )}
            >
              {m}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#0A0A0A] text-white">

      {/* ── Ambient background ───────────────────── */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.022)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(201,168,76,0.09),transparent_65%)]" />
        <div className="absolute bottom-0 right-0 h-[350px] w-[550px] bg-[radial-gradient(ellipse,rgba(201,168,76,0.04),transparent_65%)]" />
      </div>

      {/* ── Navbar ──────────────────────────────────── */}
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-8">
        <div>
          <p className="text-2xl font-medium tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
            NEXUS
          </p>
          <p className="text-[10px] uppercase tracking-[0.28em] text-white/30">Premium POS</p>
        </div>

        <nav className="hidden items-center gap-6 sm:flex" aria-label="Navegación principal">
          <Link href="#features" className="text-sm text-white/50 transition-colors hover:text-white">Producto</Link>
          <Link href="#plans" className="text-sm text-white/50 transition-colors hover:text-white">Planes</Link>
          <Link href="/login" className="text-sm text-white/50 transition-colors hover:text-white">Ingresar</Link>
        </nav>

        <Link
          href="/register"
          className="hidden h-9 items-center gap-2 rounded-full border border-[rgba(201,168,76,0.35)] bg-[rgba(201,168,76,0.08)] px-4 text-sm font-medium text-[#C9A84C] transition-all hover:border-[rgba(201,168,76,0.6)] hover:bg-[rgba(201,168,76,0.15)] sm:inline-flex"
        >
          Empezar gratis <ArrowRight size={12} />
        </Link>

        <Link
          href="/register"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#C9A84C] px-4 text-sm font-semibold text-[#0A0A0A] sm:hidden"
        >
          Empezar
        </Link>
      </header>

      {/* ── Hero ────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-10 sm:px-8 lg:pt-14">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-12">

          {/* Copy */}
          <div className="animate-fade-up">
            <div className="badge-glow inline-flex items-center gap-2 rounded-full border border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.07)] px-3.5 py-1.5 text-xs font-medium text-[#C9A84C]">
              <Zap size={11} />
              Offline-first · Multi-sucursal · DIAN ready
            </div>

            <h1
              className="mt-6 text-5xl font-medium leading-[0.93] tracking-[-0.03em] sm:text-6xl xl:text-[72px]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              El POS que tu<br />
              negocio{' '}
              <span className="text-shimmer">merece.</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-8 text-white/50 sm:text-lg">
              Caja, inventario, sucursales, analíticas y operación sin internet — todo en una plataforma pensada para el comercio colombiano.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-[#C9A84C] px-7 text-[15px] font-semibold text-[#0A0A0A] shadow-[0_4px_24px_rgba(201,168,76,0.35)] transition-all hover:bg-[#E8C96A] hover:shadow-[0_6px_36px_rgba(201,168,76,0.5)] active:scale-[0.98]"
              >
                Crear mi cuenta <ArrowRight size={15} />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] border border-white/10 px-7 text-[15px] font-medium text-white/65 transition-all hover:border-white/20 hover:text-white active:scale-[0.98]"
              >
                Ya tengo cuenta
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/8 pt-6">
              {[
                'Sin tarjeta de crédito',
                'Configuración en minutos',
                'Soporte en español',
              ].map((text) => (
                <div key={text} className="flex items-center gap-1.5 text-xs text-white/35">
                  <CheckCircle2 size={11} className="text-[#C9A84C]" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* POS visual */}
          <div className="animate-fade-up animate-fade-up-2 lg:pl-4">
            <POSMock />
          </div>
        </div>
      </section>

      {/* ── Marquee ─────────────────────────────────── */}
      <div className="relative z-10 overflow-hidden border-y border-white/[0.06] bg-white/[0.015] py-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-[linear-gradient(to_right,#0A0A0A,transparent)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-[linear-gradient(to_left,#0A0A0A,transparent)]" />
        <div className="marquee-track">
          {[...BUSINESS_TYPES, ...BUSINESS_TYPES].map((item, i) => (
            <div key={i} className="flex flex-none items-center gap-4 px-6 text-sm text-white/30">
              <span className="h-1 w-1 rounded-full bg-[#C9A84C]/40" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* ── Bento features ──────────────────────────── */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:py-28">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C9A84C]">Producto</p>
          <h2
            className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Todo lo que necesitas<br />en una sola pantalla.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/45">
            Diseñado para la caja real, no para la demo. Cada módulo tiene un propósito claro y un flujo pensado para operar bajo presión.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid gap-3 md:grid-cols-3 lg:gap-4">

          {/* Card 1: POS — col-span-2 */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] p-6 transition-all duration-300 hover:border-[rgba(201,168,76,0.22)] md:col-span-2">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,168,76,0.07),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded-[14px] border border-[rgba(201,168,76,0.2)] bg-[rgba(201,168,76,0.08)]">
                  <Store size={20} className="text-[#C9A84C]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">POS y sesiones de caja</h3>
                  <p className="mt-1 max-w-sm text-sm leading-6 text-white/45">Cobrar es lo más importante. Flujo corto, órdenes en espera, F3 para retener y lector de código de barras.</p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-[rgba(201,168,76,0.15)] bg-[rgba(201,168,76,0.05)] px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/35">Total en caja</span>
                  <span className="font-mono text-xl font-bold text-[#C9A84C]">$247.500</span>
                </div>
                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  {['Efectivo', 'Tarjeta', 'Transferencia'].map((m, i) => (
                    <div
                      key={m}
                      className={cn(
                        'rounded-lg py-2 text-center text-[12px] transition-colors',
                        i === 0 ? 'bg-[rgba(201,168,76,0.18)] font-medium text-[#C9A84C]' : 'bg-white/5 text-white/35',
                      )}
                    >
                      {m}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Offline */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] p-6 transition-all duration-300 hover:border-[rgba(201,168,76,0.22)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(201,168,76,0.07),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-[rgba(201,168,76,0.2)] bg-[rgba(201,168,76,0.08)]">
                <CloudOff size={20} className="text-[#C9A84C]" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">Offline-first</h3>
              <p className="mt-1 text-sm leading-6 text-white/45">Sin internet, la caja no para. SQLite local almacena las ventas y sincroniza cuando vuelve la conexión.</p>
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2.5">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-xs text-white/40">Cola local activa · 3 órdenes pendientes</span>
              </div>
            </div>
          </div>

          {/* Card 3: Analytics */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] p-6 transition-all duration-300 hover:border-[rgba(201,168,76,0.22)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,168,76,0.07),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-[rgba(201,168,76,0.2)] bg-[rgba(201,168,76,0.08)]">
                <BarChart3 size={20} className="text-[#C9A84C]" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">Analíticas en tiempo real</h3>
              <p className="mt-1 text-sm leading-6 text-white/45">Ventas diarias, top productos, clientes frecuentes, margen estimado y rotación de inventario.</p>

              {/* Mini chart */}
              <div className="mt-5 flex h-10 items-end gap-1">
                {[38, 62, 44, 78, 52, 88, 65, 71].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm transition-all duration-500 group-hover:opacity-100"
                    style={{ height: `${h}%`, background: `rgba(201,168,76,${0.12 + (h / 100) * 0.38})` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Card 4: Inventory */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] p-6 transition-all duration-300 hover:border-[rgba(201,168,76,0.22)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.07),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-[rgba(201,168,76,0.2)] bg-[rgba(201,168,76,0.08)]">
                <Boxes size={20} className="text-[#C9A84C]" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">Inventario completo</h3>
              <p className="mt-1 text-sm leading-6 text-white/45">Productos, variantes, kardex, stock mínimo, recepción de mercancía e imágenes por Cloudinary.</p>

              <div className="mt-5 space-y-1.5">
                {[['Camiseta M / Azul', '42 uds'], ['Jean 32 / Negro', '8 uds'], ['Cinturón café', '⚠ 2 uds']].map(([name, stock]) => (
                  <div key={name as string} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1.5 text-[12px]">
                    <span className="text-white/55">{name as string}</span>
                    <span className={cn('font-mono', (stock as string).startsWith('⚠') ? 'text-amber-400' : 'text-white/40')}>{stock as string}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 5: Multi-branch + Security — col-span-2 */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] p-6 transition-all duration-300 hover:border-[rgba(201,168,76,0.22)] md:col-span-2">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(201,168,76,0.07),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative grid gap-8 sm:grid-cols-2">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-[rgba(201,168,76,0.2)] bg-[rgba(201,168,76,0.08)]">
                  <LayoutGrid size={20} className="text-[#C9A84C]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">Multi-sucursal</h3>
                <p className="mt-1 text-sm leading-6 text-white/45">Cada local con su terminal, sus límites de plan y su configuración operativa independiente.</p>
              </div>
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-[rgba(201,168,76,0.2)] bg-[rgba(201,168,76,0.08)]">
                  <ShieldCheck size={20} className="text-[#C9A84C]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">Roles y seguridad</h3>
                <p className="mt-1 text-sm leading-6 text-white/45">Usuarios del sistema separados de empleados. Roles editables, recuperación de acceso y JWT rotado.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Plans ───────────────────────────────────── */}
      <section id="plans" className="relative z-10 mx-auto max-w-7xl px-6 pb-20 sm:px-8 lg:pb-28">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C9A84C]">Planes</p>
          <h2
            className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Sin sorpresas al pagar.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-white/45">
            Planes que escalan con tu operación. Empieza con lo que necesitas y crece sin fricciones ni costos ocultos.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'relative rounded-2xl border p-6 transition-all duration-300',
                plan.highlight
                  ? 'border-[rgba(201,168,76,0.35)] bg-[rgba(201,168,76,0.05)] shadow-[0_0_50px_rgba(201,168,76,0.07)]'
                  : 'border-white/[0.07] bg-[#111111] hover:border-white/15',
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full border border-[rgba(201,168,76,0.5)] bg-[#C9A84C] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0A0A0A]">
                  {plan.badge}
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-[#C9A84C]">{plan.name}</p>
                <p className="mt-1 text-2xl font-medium text-white">{plan.price}</p>
                <p className="mt-2 text-sm leading-6 text-white/45">{plan.description}</p>
              </div>

              <ul className="mt-6 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/65">
                    <CheckCircle2 size={14} className="flex-none text-[#C9A84C]" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.cta.href}
                className={cn(
                  'mt-8 flex h-11 w-full items-center justify-center rounded-[10px] text-sm font-semibold transition-all active:scale-[0.98]',
                  plan.highlight
                    ? 'bg-[#C9A84C] text-[#0A0A0A] shadow-[0_4px_20px_rgba(201,168,76,0.28)] hover:bg-[#E8C96A] hover:shadow-[0_4px_28px_rgba(201,168,76,0.4)]'
                    : 'border border-white/10 text-white hover:border-white/20 hover:bg-white/5',
                )}
              >
                {plan.cta.label}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20 sm:px-8 lg:pb-28">
        <div className="relative overflow-hidden rounded-3xl border border-[rgba(201,168,76,0.18)] bg-[linear-gradient(135deg,rgba(201,168,76,0.07),rgba(201,168,76,0.02))] px-8 py-16 text-center sm:px-12">
          <div className="absolute inset-0 [background-image:linear-gradient(rgba(201,168,76,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(201,168,76,0.035)_1px,transparent_1px)] [background-size:48px_48px]" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C9A84C]">Empieza hoy</p>
            <h2
              className="mx-auto mt-4 max-w-2xl text-4xl font-medium tracking-tight sm:text-5xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Tu negocio merece<br />una caja a la altura.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-base leading-7 text-white/50">
              Registro en minutos. Sin tarjeta de crédito. Sin fricción. Solo tú y tu negocio funcionando bien.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="inline-flex h-12 items-center gap-2 rounded-[12px] bg-[#C9A84C] px-8 text-[15px] font-semibold text-[#0A0A0A] shadow-[0_4px_28px_rgba(201,168,76,0.38)] transition-all hover:bg-[#E8C96A] hover:shadow-[0_6px_40px_rgba(201,168,76,0.55)] active:scale-[0.98]"
              >
                Crear mi cuenta <ArrowRight size={15} />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center gap-2 rounded-[12px] border border-white/10 px-8 text-[15px] text-white/65 transition-all hover:border-white/20 hover:text-white active:scale-[0.98]"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[0.06] px-6 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-white/25">
            © 2025 NEXUS POS · Hecho para el comercio colombiano
          </p>
          <div className="flex gap-6">
            <Link href="/login" className="text-sm text-white/25 transition-colors hover:text-white/60">Ingresar</Link>
            <Link href="/register" className="text-sm text-white/25 transition-colors hover:text-white/60">Registro</Link>
          </div>
        </div>
      </footer>

    </main>
  );
}
