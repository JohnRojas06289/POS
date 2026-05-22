import Link from 'next/link';
import { LandingNav } from '../components/landing/LandingNav';
import { FaqAccordion } from '../components/landing/FaqAccordion';
import { SectorSelector } from '../components/landing/SectorSelector';

export const metadata = {
  title: 'NEXUS POS — El sistema operativo de tu negocio',
  description: 'POS, inventario, analíticas y agente IA en una sola plataforma. Diseñado para el comercio colombiano. Empieza gratis.',
};

// ─── Shared helpers ──────────────────────────────────────────────────────────

function GoldDot() {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[5px]"
      style={{ background: 'var(--gold-500)' }}
    />
  );
}

function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
      <GoldDot />
      <span>{children}</span>
    </li>
  );
}

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
      style={{
        background: 'rgba(201,168,76,0.08)',
        color: 'var(--gold-500)',
        border: '1px solid var(--border-gold)',
      }}
    >
      {children}
    </span>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-3xl md:text-4xl font-medium tracking-tight mb-4 leading-tight"
      style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
    >
      {children}
    </h2>
  );
}

function SectionSub({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-base leading-relaxed mb-8 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
      {children}
    </p>
  );
}

// ─── Mock UI Cards ────────────────────────────────────────────────────────────

function PosMockup() {
  const items = [
    { name: 'Camiseta Negra Oversize', qty: 2, price: '$59.900' },
    { name: 'Jean Slim Azul T32', qty: 1, price: '$89.900' },
    { name: 'Cinturón Cuero Café', qty: 1, price: '$34.900' },
  ];
  return (
    <div
      className="rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0A0A0A' }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <span className="ml-2 text-xs text-white/20">NEXUS POS — Caja Principal</span>
      </div>
      <div className="p-4">
        <div className="space-y-2 mb-4">
          {items.map((item) => (
            <div key={item.name} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div>
                <p className="text-xs font-medium text-white/80">{item.name}</p>
                <p className="text-xs text-white/30">×{item.qty}</p>
              </div>
              <span className="text-xs font-semibold" style={{ color: '#C9A84C' }}>{item.price}</span>
            </div>
          ))}
        </div>
        <div className="px-3 py-2 rounded-lg mb-3" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
          <div className="flex justify-between">
            <span className="text-xs text-white/40">Subtotal</span>
            <span className="text-xs text-white/60">$184.700</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs font-semibold text-white/80">Total</span>
            <span className="text-sm font-bold" style={{ color: '#C9A84C' }}>$184.700</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {['Efectivo', 'Nequi', 'Tarjeta'].map((m, i) => (
            <div
              key={m}
              className="py-2 rounded-lg text-center text-xs font-medium"
              style={{
                background: i === 0 ? '#C9A84C' : 'rgba(255,255,255,0.05)',
                color: i === 0 ? '#0A0A0A' : 'rgba(255,255,255,0.5)',
              }}
            >
              {m}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InventoryMockup() {
  const products = [
    { name: 'Camiseta Negra Oversize', sku: 'CAM-001', stock: 24, cpp: '$28.000', status: 'ok' },
    { name: 'Jean Slim Azul T32', sku: 'JEA-032', stock: 7, cpp: '$54.000', status: 'low' },
    { name: 'Blusa Floral Manga Corta', sku: 'BLU-014', stock: 0, cpp: '$22.000', status: 'out' },
    { name: 'Cinturón Cuero Café', sku: 'CIN-007', stock: 15, cpp: '$18.500', status: 'ok' },
  ];
  const statusColor = (s: string) => s === 'ok' ? '#34D399' : s === 'low' ? '#EF9F27' : '#F09595';
  const statusLabel = (s: string) => s === 'ok' ? 'Disponible' : s === 'low' ? 'Stock bajo' : 'Agotado';

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0A0A0A' }}>
        <span className="text-xs text-white/30 font-medium">Inventario · 4 productos</span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>+ Añadir</span>
      </div>
      <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        {products.map((p) => (
          <div key={p.sku} className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white/80">{p.name}</p>
              <p className="text-xs text-white/25 mt-0.5">{p.sku} · CPP {p.cpp}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-white/70">{p.stock} uds</p>
              <p className="text-xs mt-0.5" style={{ color: statusColor(p.status) }}>{statusLabel(p.status)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsMockup() {
  const bars = [42, 68, 55, 80, 95, 72, 88];
  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  return (
    <div
      className="rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0A0A0A' }}>
        <p className="text-xs text-white/30">Ventas — últimos 7 días</p>
        <p className="text-lg font-bold mt-0.5" style={{ color: '#C9A84C' }}>$2.847.300</p>
      </div>
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-end gap-2 h-24 mb-2">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div
                className="w-full rounded-t-sm"
                style={{ height: `${h}%`, background: i === 6 ? '#C9A84C' : 'rgba(201,168,76,0.25)' }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          {days.map((d, i) => (
            <div key={i} className="flex-1 text-center text-xs" style={{ color: i === 6 ? '#C9A84C' : 'rgba(255,255,255,0.2)' }}>
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: 'Ticket promedio', value: '$87.400' },
            { label: 'Transacciones', value: '33' },
            { label: 'Margen', value: '41%' },
          ].map((k) => (
            <div key={k.label} className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <p className="text-xs text-white/25 mb-0.5">{k.label}</p>
              <p className="text-sm font-semibold text-white/80">{k.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AiMockup() {
  const messages = [
    { role: 'user', text: '¿Qué producto me deja más margen este mes?' },
    { role: 'ai', text: 'La Camiseta Negra Oversize tiene el mayor margen: 58% con 24 unidades vendidas. Te genera $812.400 en utilidad bruta. ¿Quieres ver el detalle por semana?' },
    { role: 'user', text: '¿Cuándo debo reabastecer el Jean Slim?' },
    { role: 'ai', text: 'Con 7 unidades y rotación de 3 und/semana, tienes stock para 2 semanas. Haz el pedido esta semana para evitar quiebres de stock.' },
  ];
  return (
    <div
      className="rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0A0A0A' }}>
        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.2)' }}>
          <span className="text-xs">✦</span>
        </div>
        <span className="text-xs text-white/40">Agente NEXUS</span>
        <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399' }}>En línea</span>
      </div>
      <div className="p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed"
              style={{
                background: m.role === 'user' ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.05)',
                color: m.role === 'user' ? '#E8C96A' : 'rgba(255,255,255,0.7)',
                border: `1px solid ${m.role === 'user' ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Marquee ─────────────────────────────────────────────────────────────────

const MARQUEE_ITEMS = [
  '✦ Punto de venta offline', '✦ Inventario multi-variante', '✦ Cierre de caja diario',
  '✦ Kardex automático', '✦ Analíticas en tiempo real', '✦ Agente IA',
  '✦ Recibos digitales', '✦ Múltiples métodos de pago', '✦ Crédito de tienda',
  '✦ CPP automático', '✦ Multi-sucursal', '✦ WhatsApp integrado',
];

function Marquee() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div
      className="py-4 overflow-hidden"
      style={{ borderTop: '1px solid var(--border-default)', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}
    >
      <style>{`
        @keyframes nexus-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .nexus-marquee-track { display: flex; width: max-content; animation: nexus-marquee 40s linear infinite; }
        .nexus-marquee-track:hover { animation-play-state: paused; }
      `}</style>
      <div className="nexus-marquee-track">
        {items.map((item, i) => (
          <span
            key={i}
            className="text-xs font-medium mx-6 whitespace-nowrap"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Plans data ───────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: 'Starter',
    price: 'Gratis',
    sub: 'Para siempre',
    description: 'Para empezar a organizar tu negocio sin ningún costo.',
    features: ['50 productos', '1 usuario', 'POS básico', 'Inventario básico', 'Recibos digitales', '1 sucursal'],
    cta: 'Empezar gratis',
    href: '/onboarding',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '$89.900',
    sub: '/ mes · COP',
    description: 'Para negocios que quieren crecer con datos e inteligencia.',
    features: [
      'Productos ilimitados', 'Hasta 5 usuarios', 'Agente IA incluido',
      'Analíticas avanzadas', 'Kardex y CPP automático', 'Hasta 3 sucursales',
      'Cierre de caja digital', 'WhatsApp integrado',
    ],
    cta: 'Empezar Growth',
    href: '/onboarding?plan=growth',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: '$189.900',
    sub: '/ mes · COP',
    description: 'Para cadenas y comercios con operación compleja.',
    features: [
      'Todo lo de Growth', 'Usuarios ilimitados', 'Sucursales ilimitadas',
      'Roles y permisos avanzados', 'API de integración', 'Soporte prioritario', 'Onboarding personalizado',
    ],
    cta: 'Contactar ventas',
    href: '/onboarding?plan=enterprise',
    highlight: false,
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <LandingNav />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center top, rgba(201,168,76,0.08) 0%, transparent 70%)' }}
        />
        <div className="max-w-5xl mx-auto text-center relative">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8"
            style={{
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid var(--border-gold)',
              color: 'var(--gold-500)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--gold-500)' }} />
            Diseñado para el comercio colombiano
          </div>

          <h1
            className="text-5xl md:text-7xl font-medium tracking-tight mb-6 leading-[1.05]"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            El sistema operativo<br />
            <span style={{ color: 'var(--gold-500)' }}>de tu negocio</span>
          </h1>

          <p
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            POS, inventario, analíticas y agente IA en una sola plataforma.
            Diseñado para tiendas colombianas que quieren vender más y perder menos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboarding"
              className="px-7 py-3.5 rounded-xl text-base font-semibold transition-all active:scale-95"
              style={{ background: 'var(--gold-500)', color: '#0A0A0A', boxShadow: '0 0 32px rgba(201,168,76,0.25)' }}
            >
              Empezar gratis — sin tarjeta
            </Link>
            <a
              href="#pos"
              className="px-7 py-3.5 rounded-xl text-base font-medium transition-colors"
              style={{ border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
            >
              Ver cómo funciona →
            </a>
          </div>
          <p className="mt-5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Gratis para siempre · Sin setup · Datos en Colombia
          </p>

          {/* Hero browser mockup */}
          <div className="mt-16 max-w-2xl mx-auto">
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.06)' }}
            >
              <div className="px-4 py-3 flex items-center gap-2" style={{ background: '#0A0A0A', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F57' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FEBC2E' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#28C840' }} />
                </div>
                <span className="text-xs text-white/20 mx-auto">nexus.app — Punto de Venta</span>
              </div>
              <div className="grid grid-cols-3 gap-0" style={{ background: '#111111' }}>
                <div className="col-span-2 p-4" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-xs text-white/30 mb-3">Productos recientes</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['Camiseta', 'Jean', 'Blusa', 'Cinturón', 'Mochila', 'Sudadera'].map((p) => (
                      <div key={p} className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="w-8 h-8 rounded-md mx-auto mb-1.5" style={{ background: 'rgba(201,168,76,0.08)' }} />
                        <p className="text-xs text-white/50">{p}</p>
                        <p className="text-xs font-medium mt-0.5" style={{ color: '#C9A84C' }}>$59k</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4" style={{ background: '#0D0D0D' }}>
                  <p className="text-xs text-white/30 mb-3">Carrito</p>
                  <div className="space-y-2">
                    {['Camiseta ×2', 'Jean ×1'].map((item) => (
                      <div key={item} className="flex justify-between text-xs py-1">
                        <span className="text-white/50">{item}</span>
                        <span style={{ color: '#C9A84C' }}>$118k</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex justify-between text-xs mb-3">
                      <span className="font-medium text-white/80">Total</span>
                      <span className="font-bold" style={{ color: '#C9A84C' }}>$207k</span>
                    </div>
                    <div className="py-2 rounded-lg text-center text-xs font-semibold" style={{ background: '#C9A84C', color: '#0A0A0A' }}>
                      Cobrar
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee ───────────────────────────────────────────────────────── */}
      <Marquee />

      {/* ── Social proof strip ───────────────────────────────────────────── */}
      <section className="py-8 px-6" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x" style={{ '--tw-divide-opacity': 1, borderColor: 'var(--border-default)' } as React.CSSProperties}>
            {[
              { number: '★ 4.8 / 5', label: 'Valoración promedio de usuarios' },
              { number: '+2.000', label: 'Negocios activos en Colombia' },
              { number: '5 min', label: 'Para configurar tu tienda completa' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center justify-center text-center py-5 px-8 gap-1">
                <span
                  className="text-2xl font-bold"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-500)' }}
                >
                  {stat.number}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why NEXUS ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: 'var(--bg-surface)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <SectionTag>Por qué NEXUS</SectionTag>
            <h2
              className="text-3xl md:text-4xl font-medium tracking-tight mb-4"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              Construido para el comercio real
            </h2>
            <p className="max-w-xl mx-auto text-base" style={{ color: 'var(--text-secondary)' }}>
              No es una adaptación de software extranjero. NEXUS nació pensando en las tiendas de barrio,
              las boutiques y los negocios familiares colombianos.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '⚡', title: 'Funciona sin internet', body: 'El POS sigue operando cuando se va la conexión. Las ventas se sincronizan al reconectarse automáticamente.' },
              { icon: '🇨🇴', title: 'Hecho para Colombia', body: 'Pesos colombianos, Nequi, Daviplata, IVA colombiano y horarios de caja adaptados a la operación local.' },
              { icon: '🔒', title: 'Tus datos, solo tuyos', body: 'Cada negocio tiene su base de datos aislada. Nadie más ve tu información, nunca, bajo ninguna circunstancia.' },
              { icon: '✦', title: 'IA que entiende tu negocio', body: 'Pregunta en español natural. El agente responde con datos reales de tu operación, no respuestas genéricas.' },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-xl p-5"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)' }}
              >
                <span className="text-2xl mb-4 block">{card.icon}</span>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{card.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sector selector (interactive) ────────────────────────────────── */}
      <SectorSelector />

      {/* ── POS ──────────────────────────────────────────────────────────── */}
      <section id="pos" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <PosMockup />
            </div>
            <div className="order-1 md:order-2">
              <SectionTag>Punto de venta</SectionTag>
              <SectionHeading>Cobra en segundos,<br />sin complicaciones</SectionHeading>
              <SectionSub>
                Una interfaz diseñada para velocidad: busca por nombre o código de barras,
                agrega al carrito y cobra en múltiples métodos sin perder el ritmo.
              </SectionSub>
              <ul className="space-y-3">
                <FeatureItem>Búsqueda instantánea por nombre, referencia o código de barras</FeatureItem>
                <FeatureItem>Pagos mixtos: efectivo + Nequi + tarjeta en una sola venta</FeatureItem>
                <FeatureItem>Descuentos por ítem o sobre el total de la venta</FeatureItem>
                <FeatureItem>Crédito de tienda (fiado) con registro de deuda por cliente</FeatureItem>
                <FeatureItem>Recibo digital por WhatsApp o impresión térmica física</FeatureItem>
                <FeatureItem>Apertura y cierre de caja con arqueo y diferencia de efectivo</FeatureItem>
                <FeatureItem>Modo offline: sigue vendiendo sin conexión a internet</FeatureItem>
                <FeatureItem>Múltiples terminales simultáneos por sucursal</FeatureItem>
              </ul>
              <Link href="/onboarding" className="inline-flex items-center gap-2 mt-8 text-sm font-medium" style={{ color: 'var(--gold-500)' }}>
                Probar el POS gratis →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Inventory ────────────────────────────────────────────────────── */}
      <section id="inventario" className="py-24 px-6" style={{ background: 'var(--bg-surface)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <SectionTag>Inventario</SectionTag>
              <SectionHeading>Sabe exactamente qué<br />tienes y dónde</SectionHeading>
              <SectionSub>
                Inventario en tiempo real que se actualiza con cada venta, compra y ajuste.
                Con variantes, lotes y trazabilidad completa de cada movimiento.
              </SectionSub>
              <ul className="space-y-3">
                <FeatureItem>Variantes por talla, color o cualquier atributo personalizado</FeatureItem>
                <FeatureItem>Costo Promedio Ponderado (CPP) calculado automáticamente con cada compra</FeatureItem>
                <FeatureItem>Kardex: historial completo de movimientos por producto y fecha</FeatureItem>
                <FeatureItem>Alertas de stock mínimo antes de quedarte sin existencias</FeatureItem>
                <FeatureItem>Ajustes de inventario con motivo (merma, daño, conteo físico)</FeatureItem>
                <FeatureItem>Recepción de compras con actualización automática de costo y stock</FeatureItem>
                <FeatureItem>Valoración del inventario por CPP o precio de venta en tiempo real</FeatureItem>
                <FeatureItem>Exportación a CSV para contabilidad, auditoría o proveedores</FeatureItem>
              </ul>
              <Link href="/onboarding" className="inline-flex items-center gap-2 mt-8 text-sm font-medium" style={{ color: 'var(--gold-500)' }}>
                Ver inventario en acción →
              </Link>
            </div>
            <div>
              <InventoryMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Analytics ────────────────────────────────────────────────────── */}
      <section id="analiticas" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <AnalyticsMockup />
            </div>
            <div className="order-1 md:order-2">
              <SectionTag>Analíticas</SectionTag>
              <SectionHeading>Toma decisiones con<br />datos, no con intuición</SectionHeading>
              <SectionSub>
                Dashboards que muestran lo que importa: ventas, márgenes, productos estrella
                y clientes frecuentes — actualizados con cada transacción.
              </SectionSub>
              <ul className="space-y-3">
                <FeatureItem>Resumen diario, semanal y mensual de ventas, ingresos y utilidad</FeatureItem>
                <FeatureItem>Ticket promedio, número de transacciones y horas pico de venta</FeatureItem>
                <FeatureItem>Ranking de productos por unidades vendidas, ingresos y margen</FeatureItem>
                <FeatureItem>Análisis de métodos de pago más usados por tus clientes</FeatureItem>
                <FeatureItem>Valoración del inventario y velocidad de rotación por producto</FeatureItem>
                <FeatureItem>Análisis de clientes: frecuencia, ticket promedio y saldo de crédito</FeatureItem>
                <FeatureItem>Comparativo período a período (esta semana vs. la anterior)</FeatureItem>
                <FeatureItem>Actualización automática después de cada venta registrada</FeatureItem>
              </ul>
              <Link href="/onboarding" className="inline-flex items-center gap-2 mt-8 text-sm font-medium" style={{ color: 'var(--gold-500)' }}>
                Ver mis analíticas →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI Agent ─────────────────────────────────────────────────────── */}
      <section id="ia" className="py-24 px-6" style={{ background: 'var(--bg-surface)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <SectionTag>Agente IA</SectionTag>
              <SectionHeading>Tu CFO personal<br />disponible 24/7</SectionHeading>
              <SectionSub>
                Pregunta lo que quieras sobre tu negocio en español natural. El Agente NEXUS
                consulta tus datos en tiempo real y responde con precisión.
              </SectionSub>
              <ul className="space-y-3">
                <FeatureItem>Responde preguntas sobre ventas, inventario y clientes en segundos</FeatureItem>
                <FeatureItem>Detecta anomalías: caídas de venta, productos sin rotación, stock crítico</FeatureItem>
                <FeatureItem>Proyecta cuándo se agota un producto según su rotación histórica</FeatureItem>
                <FeatureItem>Identifica tus productos y clientes más rentables del mes</FeatureItem>
                <FeatureItem>Sugiere precios de compra ideales para mantener tu margen objetivo</FeatureItem>
                <FeatureItem>Disponible desde el panel web y por WhatsApp</FeatureItem>
              </ul>
              <div
                className="mt-8 px-4 py-3 rounded-xl text-sm italic leading-relaxed"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border-gold)', color: 'var(--text-secondary)' }}
              >
                "¿Cuánto vendí la semana pasada comparado con la anterior?" — el Agente
                te responde con los números exactos, sin abrir ningún reporte.
              </div>
              <Link href="/onboarding" className="inline-flex items-center gap-2 mt-6 text-sm font-medium" style={{ color: 'var(--gold-500)' }}>
                Activar el Agente IA →
              </Link>
            </div>
            <div>
              <AiMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: 'var(--bg-surface)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <SectionTag>Historias reales</SectionTag>
            <h2
              className="text-3xl md:text-4xl font-medium tracking-tight mb-4"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              Negocios que ya crecieron con NEXUS
            </h2>
            <p className="max-w-xl mx-auto text-base" style={{ color: 'var(--text-secondary)' }}>
              No son promesas. Son resultados de comerciantes colombianos como tú.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: 'Antes perdía $300.000 al mes en diferencias de caja sin saber por qué. Con NEXUS, cero diferencias y sé exactamente qué pasó en cada turno.',
                name: 'Andrés M.',
                business: 'Tienda de ropa',
                city: 'Medellín',
                result: '↑ 40% en ventas mensuales',
              },
              {
                quote: 'El agente IA me dijo cuál producto me dejaba más margen este mes. Nunca lo hubiera calculado solo y ahora tomo mejores decisiones de compra.',
                name: 'Diana P.',
                business: 'Minimercado',
                city: 'Bogotá',
                result: '↓ 60% tiempo en reportes',
              },
              {
                quote: 'Mis clientes pagan con Nequi, tarjeta y efectivo en la misma venta. NEXUS lo maneja solo, sin apps aparte ni complicaciones.',
                name: 'Fernando R.',
                business: 'Restaurante',
                city: 'Cali',
                result: '↑ 35% en ticket promedio',
              },
            ].map((t) => (
              <div
                key={t.name}
                className="rounded-2xl p-6 flex flex-col gap-5"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)' }}
              >
                <div
                  className="flex-1 text-sm leading-relaxed italic"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  "{t.quote}"
                </div>
                <div
                  className="pt-4 flex items-center justify-between"
                  style={{ borderTop: '1px solid var(--border-default)' }}
                >
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{t.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t.business} · {t.city}</p>
                  </div>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--gold-500)', border: '1px solid var(--border-gold)' }}
                  >
                    {t.result}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { number: '100%', label: 'Multi-tenant seguro' },
              { number: '48h', label: 'Cache offline de productos' },
              { number: '< 1s', label: 'Tiempo promedio de cobro' },
              { number: '∞', label: 'Ventas por mes en planes pagos' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-500)' }}>
                  {stat.number}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Plans ──────────────────────────────────────────────────────── */}
      <section id="planes" className="py-24 px-6" style={{ background: 'var(--bg-surface)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <SectionTag>Planes y precios</SectionTag>
            <h2
              className="text-3xl md:text-4xl font-medium tracking-tight mb-4"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              Sin sorpresas, sin letras pequeñas
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Empieza gratis. Crece cuando lo necesites. Cancela cuando quieras.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className="rounded-2xl p-6 flex flex-col relative"
                style={{
                  background: 'var(--bg-base)',
                  border: plan.highlight ? '1.5px solid var(--gold-500)' : '1px solid var(--border-default)',
                  boxShadow: plan.highlight ? '0 0 40px rgba(201,168,76,0.1)' : 'none',
                }}
              >
                {plan.highlight && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                    style={{ background: 'var(--gold-500)', color: '#0A0A0A' }}
                  >
                    Más popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span
                      className="text-3xl font-bold"
                      style={{ fontFamily: 'var(--font-display)', color: plan.highlight ? 'var(--gold-500)' : 'var(--text-primary)' }}
                    >
                      {plan.price}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{plan.sub}</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{plan.description}</p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="var(--gold-500)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className="block text-center py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
                  style={
                    plan.highlight
                      ? { background: 'var(--gold-500)', color: '#0A0A0A' }
                      : { background: 'var(--bg-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }
                  }
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-xs mt-8" style={{ color: 'var(--text-tertiary)' }}>
            Todos los planes incluyen actualizaciones de seguridad y nuevas funcionalidades sin costo adicional.
          </p>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <SectionTag>Preguntas frecuentes</SectionTag>
            <h2
              className="text-3xl md:text-4xl font-medium tracking-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              Todo lo que necesitas saber
            </h2>
          </div>
          <FaqAccordion />
          <div className="text-center mt-12">
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              ¿Tienes otra pregunta? Escríbenos directamente.
            </p>
            <a
              href="mailto:hola@nexuspos.co"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            >
              hola@nexuspos.co
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: 'var(--bg-surface)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="rounded-2xl px-8 py-16 relative overflow-hidden"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border-gold)', boxShadow: '0 0 64px rgba(201,168,76,0.06)' }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.05) 0%, transparent 70%)' }}
            />
            <div className="relative">
              <p className="text-4xl mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-500)' }}>✦</p>
              <h2
                className="text-3xl md:text-4xl font-medium tracking-tight mb-4"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
              >
                Empieza hoy, gratis
              </h2>
              <p className="text-base mb-10 max-w-md mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Configura tu negocio en menos de 5 minutos.
                Sin tarjeta de crédito, sin contratos, sin límite de tiempo en el plan gratuito.
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold transition-all active:scale-95"
                style={{ background: 'var(--gold-500)', color: '#0A0A0A', boxShadow: '0 0 32px rgba(201,168,76,0.3)' }}
              >
                Crear mi cuenta gratis
              </Link>
              <p className="mt-5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" style={{ color: 'var(--gold-500)' }}>
                  Iniciar sesión →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="py-12 px-6" style={{ borderTop: '1px solid var(--border-default)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <span className="text-xl font-bold tracking-tight mb-3 block" style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-500)' }}>
                NEXUS
              </span>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                El sistema operativo del comercio colombiano.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>Producto</p>
              <ul className="space-y-2">
                {[
                  { label: 'Punto de Venta', href: '#pos' },
                  { label: 'Inventario', href: '#inventario' },
                  { label: 'Analíticas', href: '#analiticas' },
                  { label: 'Agente IA', href: '#ia' },
                  { label: 'Planes', href: '#planes' },
                ].map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>Empresa</p>
              <ul className="space-y-2">
                {['Acerca de', 'Blog', 'Soporte', 'Contacto'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>Legal</p>
              <ul className="space-y-2">
                {[
                  { label: 'Términos de servicio', href: '/terms' },
                  { label: 'Política de privacidad', href: '/privacy' },
                  { label: 'Tratamiento de datos', href: '/privacy' },
                ].map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6"
            style={{ borderTop: '1px solid var(--border-default)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              © {new Date().getFullYear()} NEXUS POS. Hecho con ♥ en Colombia.
            </p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Datos almacenados en Colombia · HTTPS cifrado
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
