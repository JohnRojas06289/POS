'use client';

import { useState } from 'react';
import Link from 'next/link';

// ─── Mockups ──────────────────────────────────────────────────────────────────

function RopaMockup() {
  const products = [
    { ref: 'CAM-001', name: 'Camiseta Oversize', color: '#5a3e28', sizes: ['S', 'M', 'L'], price: '$59.900' },
    { ref: 'JEA-032', name: 'Jean Slim', color: '#1a3a5c', sizes: ['28', '30', '32'], price: '$89.900' },
    { ref: 'BLU-014', name: 'Blusa Floral', color: '#8c4a6e', sizes: ['XS', 'S', 'M'], price: '$45.900' },
  ];
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ background: '#0A0A0A', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F57' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FEBC2E' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#28C840' }} />
        </div>
        <span className="ml-2 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>NEXUS — Boutique Valentina</span>
      </div>
      <div className="p-4">
        <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>Buscar por nombre, referencia o talla…</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {products.map((p) => (
            <div key={p.ref} className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-full h-9 rounded-lg mb-2" style={{ background: p.color, opacity: 0.65 }} />
              <p className="text-[11px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>{p.name}</p>
              <div className="flex gap-0.5 flex-wrap mt-1">
                {p.sizes.map((s) => (
                  <span key={s} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C' }}>{s}</span>
                ))}
              </div>
              <p className="text-[11px] font-semibold mt-1.5" style={{ color: '#C9A84C' }}>{p.price}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex justify-between mb-2">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Carrito · 2 ítems</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>+ ítem</span>
          </div>
          {[
            { name: 'Jean Slim T32', qty: '×1', price: '$89.900' },
            { name: 'Camiseta Oversize M', qty: '×2', price: '$119.800' },
          ].map((item) => (
            <div key={item.name} className="flex justify-between items-center py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{item.name}</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.qty}</p>
              </div>
              <span className="text-xs font-semibold" style={{ color: '#C9A84C' }}>{item.price}</span>
            </div>
          ))}
          <div className="flex justify-between items-center mt-2 mb-3">
            <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>Total</span>
            <span className="text-base font-bold" style={{ color: '#C9A84C' }}>$209.700</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {['Efectivo', 'Nequi', 'Tarjeta'].map((m, i) => (
              <div key={m} className="py-2 rounded-lg text-center text-xs font-medium"
                style={{ background: i === 0 ? '#C9A84C' : 'rgba(255,255,255,0.05)', color: i === 0 ? '#0A0A0A' : 'rgba(255,255,255,0.4)' }}>
                {m}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RestauranteMockup() {
  const items = [
    { name: 'Hamburguesa Clásica', detail: 'sin cebolla', qty: 2, price: '$26.000' },
    { name: 'Limonada de Fresa', detail: 'grande', qty: 3, price: '$24.000' },
    { name: 'Papas Crinkle', detail: '', qty: 2, price: '$14.000' },
  ];
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: '#0A0A0A', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F57' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FEBC2E' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#28C840' }} />
          </div>
          <span className="ml-1 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>NEXUS — La Hamburguesería</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,0.12)', color: '#34D399' }}>● Turno activo</span>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>Mesa 5</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Orden #47 · hace 12 min</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}>
            En preparación
          </span>
        </div>
        <div className="space-y-2 mb-4">
          {items.map((item) => (
            <div key={item.name} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div>
                <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{item.name}</p>
                {item.detail && <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>nota: {item.detail}</p>}
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>×{item.qty}</p>
              </div>
              <span className="text-xs font-semibold" style={{ color: '#C9A84C' }}>{item.price}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Subtotal</span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>$64.000</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>Total</span>
            <span className="text-lg font-bold" style={{ color: '#C9A84C' }}>$64.000</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="py-2 rounded-lg text-center text-xs font-medium" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
              Nequi / Daviplata
            </div>
            <div className="py-2 rounded-lg text-center text-xs font-semibold" style={{ background: '#C9A84C', color: '#0A0A0A' }}>
              Cobrar mesa
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MercadoMockup() {
  const scanned = [
    { barcode: '7702102026002', name: 'Arroz Diana 5kg', unit: '1 bolsa', price: '$18.900' },
    { barcode: '7702056720126', name: 'Aceite Palma 3L', unit: '2 botellas', price: '$43.600' },
    { barcode: '7702177010018', name: 'Jabón Rey Limón', unit: '3 barras', price: '$9.600' },
  ];
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ background: '#0A0A0A', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F57' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FEBC2E' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#28C840' }} />
        </div>
        <span className="ml-2 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>NEXUS — Mercado El Paisa</span>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4" style={{ background: 'rgba(201,168,76,0.06)', border: '1px dashed rgba(201,168,76,0.3)' }}>
          <span className="text-lg">📷</span>
          <div>
            <p className="text-xs font-medium" style={{ color: '#C9A84C' }}>Escaneando código de barras…</p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>o escribe el código / nombre del producto</p>
          </div>
        </div>
        <div className="space-y-2 mb-4">
          {scanned.map((item) => (
            <div key={item.barcode} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div>
                <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{item.name}</p>
                <p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>{item.barcode}</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.unit}</p>
              </div>
              <span className="text-xs font-semibold" style={{ color: '#C9A84C' }}>{item.price}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>Total a cobrar</span>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>6 productos · 3 referencias</p>
            </div>
            <span className="text-xl font-bold" style={{ color: '#C9A84C' }}>$72.100</span>
          </div>
          <div className="py-2.5 rounded-lg text-center text-sm font-semibold" style={{ background: '#C9A84C', color: '#0A0A0A' }}>
            Cobrar — Efectivo / Nequi
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiciosMockup() {
  const services = [
    { name: 'Corte + Barba', employee: 'Carlos', duration: '45 min', price: '$35.000' },
    { name: 'Tinte Completo', employee: 'María', duration: '90 min', price: '$80.000' },
    { name: 'Manicure + Pedicure', employee: 'Laura', duration: '60 min', price: '$45.000' },
  ];
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: '#0A0A0A', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F57' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FEBC2E' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#28C840' }} />
          </div>
          <span className="ml-1 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>NEXUS — Studio Ébano</span>
        </div>
        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Hoy · 3 servicios</span>
      </div>
      <div className="p-4">
        <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Servicios del día</p>
        <div className="space-y-2 mb-4">
          {services.map((s) => (
            <div key={s.name} className="flex items-center justify-between px-3 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div>
                <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{s.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    👤 {s.employee}
                  </span>
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>· {s.duration}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold" style={{ color: '#C9A84C' }}>{s.price}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(52,211,153,0.7)' }}>Pagado</p>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Resumen del día</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Servicios', value: '3' },
              { label: 'Ingresos', value: '$160k' },
              { label: 'Efectivo', value: '$95k' },
            ].map((k) => (
              <div key={k.label} className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{k.label}</p>
                <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.8)' }}>{k.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 py-2 rounded-lg text-center text-xs font-semibold" style={{ background: '#C9A84C', color: '#0A0A0A' }}>
            Cerrar caja del día
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sector data ──────────────────────────────────────────────────────────────

const SECTORS = [
  {
    id: 'ropa',
    icon: '👗',
    label: 'Tienda de ropa',
    tagline: 'Ropa y accesorios',
    headline: 'Vende por talla y color sin perder ninguna referencia',
    sub: 'Variantes automáticas por talla, color y referencia. Kardex por prenda, CPP actualizado con cada compra y alertas antes de quedarte sin stock.',
    features: [
      'Variantes por talla, color y atributo personalizado en un solo producto',
      'Costo Promedio Ponderado (CPP) recalculado automáticamente con cada compra',
      'Alerta de stock mínimo por referencia y talla específica',
      'Kardex completo: qué se vendió, cuándo, a quién y a qué precio',
      'Descuentos por ítem o sobre el total — sin calculadora',
      'Exporta tu catálogo a CSV para hacer pedidos al proveedor',
    ],
    ctaText: 'Abrir tienda de ropa →',
    mockup: <RopaMockup />,
  },
  {
    id: 'restaurante',
    icon: '🍔',
    label: 'Restaurante',
    tagline: 'Restaurantes y cafeterías',
    headline: 'De la toma del pedido al cobro en segundos',
    sub: 'POS flexible para barra o mesa con notas por pedido, métodos de pago mixtos y cierre de caja diario. Sin papel, sin errores.',
    features: [
      'POS por mostrador o mesa con campo de notas especiales por pedido',
      'Pagos mixtos: efectivo + Nequi + Daviplata + tarjeta en una sola cuenta',
      'Cierre de caja con arqueo de efectivo por turno y por empleado',
      'Registro de insumos y mermas para calcular costos reales de preparación',
      'Recibo digital por WhatsApp directo al cliente',
      'Control de gastos del local: proveedores, arriendo, servicios públicos',
    ],
    ctaText: 'Abrir restaurante →',
    mockup: <RestauranteMockup />,
  },
  {
    id: 'mercado',
    icon: '🛒',
    label: 'Mercado',
    tagline: 'Mercados y distribuidoras',
    headline: 'Cientos de referencias, cero caos de inventario',
    sub: 'Escanea con código de barras, vende por unidad o peso y maneja múltiples proveedores con historial de precios. Todo en tiempo real.',
    features: [
      'Búsqueda instantánea por código de barras para cobro ultrarrápido',
      'Venta por unidad, kilo, litro o cualquier unidad de medida',
      'Múltiples proveedores por producto con historial de precios de compra',
      'Alertas de stock crítico en productos de alta rotación',
      'CPP automático: siempre sabes tu costo real por unidad vendida',
      'Cierre de caja con reconciliación de efectivo y pagos digitales',
    ],
    ctaText: 'Abrir mercado →',
    mockup: <MercadoMockup />,
  },
  {
    id: 'servicios',
    icon: '✂️',
    label: 'Servicios',
    tagline: 'Peluquerías y servicios',
    headline: 'Registra cada servicio, cobra sin errores',
    sub: 'Catálogo de servicios, control de productos consumibles y resumen diario por empleado. Tu negocio de servicios, profesionalizado.',
    features: [
      'Catálogo de servicios con precio y descripción listos para cobrar',
      'Control de productos consumibles descontados por servicio realizado',
      'Registro de ingresos por empleado o profesional por turno',
      'Cobro en efectivo, Nequi, Daviplata o tarjeta sin complicación',
      'Resumen diario: cuánto facturó cada empleado y en qué método',
      'Cierre de caja digital con diferencia de efectivo y arqueo automático',
    ],
    ctaText: 'Abrir negocio de servicios →',
    mockup: <ServiciosMockup />,
  },
] as const;

type SectorId = (typeof SECTORS)[number]['id'];

// ─── Component ────────────────────────────────────────────────────────────────

function GoldDot() {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[5px]"
      style={{ background: '#C9A84C' }}
    />
  );
}

export function SectorSelector() {
  const [active, setActive] = useState<SectorId>('ropa');
  const [fading, setFading] = useState(false);

  const sector = SECTORS.find((s) => s.id === active)!;

  function handleSelect(id: SectorId) {
    if (id === active) return;
    setFading(true);
    setTimeout(() => {
      setActive(id);
      setFading(false);
    }, 180);
  }

  return (
    <section className="py-24 px-6" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
            style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}
          >
            ✦ Se adapta a tu negocio
          </span>
          <h2
            className="text-3xl md:text-4xl font-medium tracking-tight mb-4"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            El mismo sistema,{' '}
            <span style={{ color: '#C9A84C' }}>hecho para ti</span>
          </h2>
          <p className="max-w-xl mx-auto text-base" style={{ color: 'var(--text-secondary)' }}>
            No es un software genérico. NEXUS habla el lenguaje de tu tipo de negocio — selecciona el tuyo.
          </p>
        </div>

        {/* Sector tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-14">
          {SECTORS.map((s) => {
            const isActive = s.id === active;
            return (
              <button
                key={s.id}
                onClick={() => handleSelect(s.id)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200"
                style={
                  isActive
                    ? {
                        background: '#C9A84C',
                        color: '#0A0A0A',
                        boxShadow: '0 0 20px rgba(201,168,76,0.3)',
                      }
                    : {
                        background: 'var(--bg-surface)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-default)',
                      }
                }
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic content */}
        <div
          className="grid md:grid-cols-2 gap-16 items-center transition-all duration-200"
          style={{ opacity: fading ? 0 : 1, transform: fading ? 'translateY(6px)' : 'translateY(0)' }}
        >
          {/* Mockup */}
          <div className="order-2 md:order-1">
            {sector.mockup}
          </div>

          {/* Copy */}
          <div className="order-1 md:order-2">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
              style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}
            >
              {sector.icon} {sector.tagline}
            </span>
            <h3
              className="text-2xl md:text-3xl font-medium tracking-tight mb-4 leading-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              {sector.headline}
            </h3>
            <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
              {sector.sub}
            </p>
            <ul className="space-y-3 mb-8">
              {sector.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  <GoldDot />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 text-sm font-medium"
              style={{ color: '#C9A84C' }}
            >
              {sector.ctaText}
            </Link>
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-xs mt-14" style={{ color: 'var(--text-tertiary)' }}>
          ¿Tu negocio es diferente?{' '}
          <a href="mailto:hola@nexuspos.co" style={{ color: '#C9A84C' }}>
            Escríbenos — lo configuramos juntos →
          </a>
        </p>
      </div>
    </section>
  );
}
