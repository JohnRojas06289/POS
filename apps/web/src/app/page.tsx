import Link from 'next/link';
import type { ReactNode } from 'react';
import { Badge, Card } from '../components/ui';
import { ArrowRight, BarChart3, Boxes, CalendarRange, CloudOff, CreditCard, LayoutGrid, ShieldCheck, Sparkles, Store, Users, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';

export const metadata = {
  title: 'NEXUS POS | Comercio que opera rápido',
  description: 'Un POS premium para vender, controlar inventario, administrar usuarios y operar incluso sin internet.',
};

const highlights = [
  {
    title: 'Ventas rápidas',
    description: 'Cobro ágil, POS claro y flujo pensado para caja real, no para demo.',
    icon: CreditCard,
  },
  {
    title: 'Inventario vivo',
    description: 'Productos, variantes, stock mínimo, kardex y control por sucursal.',
    icon: Boxes,
  },
  {
    title: 'Operación offline',
    description: 'La caja sigue funcionando sin internet y sincroniza cuando regresa la conexión.',
    icon: CloudOff,
  },
  {
    title: 'Roles y permisos',
    description: 'Usuarios del sistema con acceso exacto. Empleados separados de la nómina.',
    icon: Users,
  },
];

const capabilities = [
  'Onboarding guiado con negocio, plan, cuenta y activación',
  'Planes claros: pago único o suscripción mensual según el negocio',
  'Multi-sucursal, terminales y control de caja por punto de venta',
  'Analíticas de ventas, inventario, clientes y rotación',
  'DIAN, impuestos y ajustes por tipo de negocio',
  'Recuperación de contraseña y acceso por email',
];

const modules = [
  {
    title: 'POS y caja',
    description: 'Venta en segundos, suspensión de órdenes y operación fluida para el mostrador.',
    icon: Store,
  },
  {
    title: 'Inventario',
    description: 'Variantes, entradas, bajo stock, kardex y trazabilidad por producto.',
    icon: Boxes,
  },
  {
    title: 'Analíticas',
    description: 'Ventas, mix de pago, top productos, clientes y margen estimado.',
    icon: BarChart3,
  },
  {
    title: 'Sucursales',
    description: 'Cada local con su terminal, sus límites y su configuración operativa.',
    icon: LayoutGrid,
  },
  {
    title: 'Calendario y turnos',
    description: 'La base para controlar operación diaria, cambios y continuidad de equipo.',
    icon: CalendarRange,
  },
  {
    title: 'Seguridad',
    description: 'Recuperación de acceso, roles y rotación segura de tokens.',
    icon: ShieldCheck,
  },
];

const businessTypes = [
  'Tienda de ropa',
  'Supermercado',
  'Restaurante',
  'Farmacia',
  'Ferretería',
  'Salón de belleza',
];

const planNotes = [
  'Lite: pago único para arrancar sin suscripción mensual.',
  'Starter y superiores: suscripción mensual con crecimiento por usuarios y sucursales.',
  'El plan define límites reales y evita sorpresas al escalar.',
];

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-2xl space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-gold)]">{eyebrow}</p>
      <h2 className="text-3xl font-medium tracking-tight text-[var(--text-primary)] sm:text-4xl">{title}</h2>
      <p className="text-sm leading-7 text-[var(--text-secondary)] sm:text-base">{description}</p>
    </div>
  );
}

function FeatureCard({ title, description, icon: Icon }: { title: string; description: string; icon: LucideIcon }) {
  return (
    <Card variant="interactive" className="group border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-all duration-200 hover:border-[var(--border-gold)]">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-[rgba(201,168,76,0.2)] bg-[rgba(201,168,76,0.08)] text-[var(--text-gold)] transition-transform duration-200 group-hover:scale-105">
          <Icon size={18} />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-[var(--text-primary)]">{title}</h3>
          <p className="text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
        </div>
      </div>
    </Card>
  );
}

function LinkButton({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] border px-6 text-[15px] font-medium transition-all duration-150 active:scale-[0.98]',
        className,
      )}
    >
      {children}
    </Link>
  );
}

export default function HomePage() {
  return (
    <main className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(201,168,76,0.18),transparent_26%),radial-gradient(circle_at_top_right,rgba(37,99,235,0.08),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(201,168,76,0.06),transparent_24%),var(--bg-base)]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px)] [background-size:72px_72px]" />

      <section className="relative mx-auto max-w-7xl px-6 pb-16 pt-6 sm:px-8 lg:px-10 lg:pb-24 lg:pt-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-medium tracking-tight text-[var(--text-primary)] sm:text-3xl">
              NEXUS
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-[var(--text-tertiary)]">Premium POS</p>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <LinkButton href="/login" className="border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]">
              Entrar
            </LinkButton>
            <LinkButton href="/register" className="border-transparent bg-[var(--gold-500)] text-[#1A1400] shadow-[var(--shadow-sm)] hover:bg-[var(--gold-400)] hover:shadow-[var(--shadow-md)]">
              Empezar ahora <ArrowRight size={14} />
            </LinkButton>
          </div>
        </header>

        <div className="mt-14 grid items-center gap-10 lg:mt-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="space-y-5">
              <Badge variant="gold" dot pulse>Comercio serio, sin fricción</Badge>
              <h1 className="max-w-4xl text-5xl font-medium leading-[0.94] tracking-tight text-[var(--text-primary)] sm:text-6xl xl:text-7xl">
                Un POS premium para vender más, controlar mejor y operar sin interrupciones.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-[var(--text-secondary)] sm:text-lg">
                NEXUS reúne caja, inventario, roles, sucursales, analíticas, DIAN y recuperación de acceso en una experiencia clara, rápida y visualmente cuidada.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/register" className="border-transparent bg-[var(--gold-500)] text-[#1A1400] shadow-[var(--shadow-sm)] hover:bg-[var(--gold-400)] hover:shadow-[var(--shadow-md)]">
                Crear mi cuenta <ArrowRight size={16} />
              </LinkButton>
              <LinkButton href="/login" className="border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]">
                Ya tengo cuenta
              </LinkButton>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['Offline-first', 'Sigue vendiendo aunque se caiga la red'],
                ['Multi-sucursal', 'Límites claros por plan y por local'],
                ['Acceso seguro', 'Login, recuperación y roles'],
              ].map(([title, description]) => (
                <div key={title} className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface)]/85 p-4 shadow-[var(--shadow-sm)] backdrop-blur-sm">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
                  <p className="mt-1 text-xs leading-6 text-[var(--text-secondary)]">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <Card className="relative overflow-hidden border-[var(--border-default)] bg-[linear-gradient(180deg,rgba(10,10,10,0.98),rgba(16,16,16,0.94))] p-6 text-white shadow-[0_30px_80px_rgba(0,0,0,0.24)] sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,168,76,0.18),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_30%)]" />
            <div className="relative space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.26em] text-white/45">Vista de operación</p>
                  <p style={{ fontFamily: 'var(--font-display)' }} className="mt-2 text-3xl font-medium tracking-tight text-[var(--text-gold)]">Caja principal</p>
                </div>
                <div className="rounded-full border border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-gold)]">
                  Live
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">Venta rápida</p>
                  <p className="mt-2 text-2xl font-medium">Flujo corto, sin ruido.</p>
                  <p className="mt-2 text-sm leading-6 text-white/65">Buscar, cobrar, imprimir y seguir. Sin pantallas interminables.</p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">Estado</p>
                  <p className="mt-2 text-2xl font-medium">Offline ready</p>
                  <p className="mt-2 text-sm leading-6 text-white/65">La cola local espera y sincroniza cuando vuelve internet.</p>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Qué incluye la plataforma</p>
                  <span className="text-xs uppercase tracking-[0.22em] text-white/40">Resumen</span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {capabilities.slice(0, 4).map((item) => (
                    <div key={item} className="rounded-[18px] border border-white/8 bg-black/10 p-3 text-sm text-white/78">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-16 sm:px-8 lg:px-10 lg:pb-24">
        <SectionTitle
          eyebrow="Lo esencial"
          title="Todo lo que prometimos, en una sola plataforma."
          description="La landing tiene que dejar claro qué hace NEXUS y por qué vale la pena entrar: ventas, inventario, acceso, resiliencia, control y crecimiento."
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {highlights.map((item, index) => (
            <div key={item.title} className="transition-all duration-300" style={{ animationDelay: `${index * 90}ms` }}>
              <FeatureCard {...item} />
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-16 sm:px-8 lg:px-10 lg:pb-24">
        <SectionTitle
          eyebrow="Módulos"
          title="La misma experiencia del producto, ordenada por tareas reales."
          description="Desde caja hasta analíticas: cada módulo tiene una razón de existir y una ruta clara hacia operación diaria."
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module, index) => (
            <div key={module.title} className="transition-all duration-300" style={{ animationDelay: `${index * 80}ms` }}>
              <FeatureCard {...module} />
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-16 sm:px-8 lg:px-10 lg:pb-24">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-5">
            <SectionTitle
              eyebrow="Planes"
              title="Lite, Starter, Pro y Enterprise, sin ambigüedad."
              description="La suscripción debe hablar el idioma del negocio: un pago único para arrancar o un plan mensual cuando el crecimiento lo exige."
            />

            <div className="space-y-3">
              {planNotes.map((note) => (
                <div key={note} className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-sm)]">
                  <p className="text-sm leading-6 text-[var(--text-secondary)]">{note}</p>
                </div>
              ))}
            </div>
          </div>

          <Card className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-[var(--text-tertiary)]">A quién le sirve</p>
                <h3 className="mt-2 text-2xl font-medium text-[var(--text-primary)]">Negocios que necesitan orden y velocidad.</h3>
              </div>
              <Sparkles className="text-[var(--text-gold)]" size={22} />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {businessTypes.map((item) => (
                <Badge key={item} variant="neutral" className="px-3 py-1 text-xs">{item}</Badge>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                'Recuperación de contraseña desde email',
                'Usuarios del sistema separados de empleados',
                'Roles editables y permisos claros',
                'Configuración por sucursal y terminal',
              ].map((item) => (
                <div key={item} className="rounded-[20px] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 text-sm text-[var(--text-secondary)]">
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-16 sm:px-8 lg:px-10 lg:pb-24">
        <Card className="overflow-hidden border-[var(--border-default)] bg-[linear-gradient(135deg,rgba(10,10,10,0.98),rgba(24,24,24,0.94))] p-6 text-white sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-4">
              <Badge variant="gold">Listo para operar</Badge>
              <h2 className="max-w-2xl text-3xl font-medium tracking-tight sm:text-4xl">
                La primera pantalla de NEXUS tiene que dejar una sola idea: esto está hecho para vender y crecer.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
                Si el usuario llega aquí, debe entender el valor, confiar en el producto y tomar acción sin leer un manual.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <LinkButton href="/register" className="border-transparent bg-[var(--gold-500)] text-[#1A1400] shadow-[var(--shadow-sm)] hover:bg-[var(--gold-400)] hover:shadow-[var(--shadow-md)]">
                Crear cuenta <ArrowRight size={16} />
              </LinkButton>
              <LinkButton href="/login" className="border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]">
                Ingresar
              </LinkButton>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
