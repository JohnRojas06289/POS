'use client';

import { useState, useEffect } from 'react';
import type { OnboardingData } from './OnboardingFlow';

interface Props {
  data: Partial<OnboardingData>;
  onNext: (data: Pick<OnboardingData, 'businessName' | 'businessType' | 'phone'>) => void;
  onBack: () => void;
}

interface BusinessTemplate {
  slug: string;
  name: string;
  description: string;
  config: {
    icon: string;
    features: string[];
    posMode: string;
    defaultTaxRate: number;
    modules: string[];
  };
}

const FALLBACK_TEMPLATES: BusinessTemplate[] = [
  {
    slug: 'retail_clothing',
    name: 'Tienda de Ropa / Boutique',
    description: 'Para almacenes de ropa, calzado y accesorios.',
    config: {
      icon: '🛍️',
      posMode: 'retail',
      defaultTaxRate: 0,
      modules: ['pos', 'inventory', 'customers'],
      features: [
        'Variantes de talla (XS → 3XL) y color',
        'Categorías: Camisas, Pantalones, Vestidos, Calzado...',
        'IVA 0% en ropa básica',
        'Fidelización de clientes y crédito',
      ],
    },
  },
  {
    slug: 'grocery',
    name: 'Supermercado / Abarrotes',
    description: 'Para tiendas de barrio, minimercados y supermercados.',
    config: {
      icon: '🛒',
      posMode: 'grocery',
      defaultTaxRate: 0,
      modules: ['pos', 'inventory', 'suppliers'],
      features: [
        'Venta por peso (kg, gramos, libras) y unidad',
        'Categorías: Frutas, Carnes, Lácteos, Granos...',
        'IVA mixto: 0% básicos, 19% procesados',
        'Gestión de múltiples proveedores',
      ],
    },
  },
  {
    slug: 'restaurant',
    name: 'Restaurante / Cafetería',
    description: 'Para restaurantes, cafeterías y negocios de comida.',
    config: {
      icon: '🍽️',
      posMode: 'restaurant',
      defaultTaxRate: 0.19,
      modules: ['pos', 'inventory', 'tables'],
      features: [
        'Gestión de mesas y comandas',
        'Categorías: Entradas, Platos, Bebidas, Postres...',
        'IVA 19% en servicios de alimentación',
        'Pantalla de cocina (KDS)',
      ],
    },
  },
  {
    slug: 'pharmacy',
    name: 'Farmacia / Droguería',
    description: 'Para droguerías y tiendas de salud.',
    config: {
      icon: '💊',
      posMode: 'retail',
      defaultTaxRate: 0,
      modules: ['pos', 'inventory', 'expiry'],
      features: [
        'Control de fechas de vencimiento',
        'IVA 0% medicamentos, 19% cosméticos',
        'Categorías: Genéricos, Marca, Vitaminas...',
        'Historial de compras por cliente',
      ],
    },
  },
  {
    slug: 'hardware_store',
    name: 'Ferretería / Materiales',
    description: 'Para ferreterías y depósitos de construcción.',
    config: {
      icon: '🔩',
      posMode: 'retail',
      defaultTaxRate: 0.19,
      modules: ['pos', 'inventory', 'suppliers'],
      features: [
        'Unidades: metro, m², litro, galón, caja...',
        'Variantes por medida y material',
        'Categorías: Eléctrico, Plomería, Pintura...',
        'Órdenes de compra a proveedores',
      ],
    },
  },
  {
    slug: 'beauty_salon',
    name: 'Salón de Belleza / Spa',
    description: 'Para salones, barberías y centros de estética.',
    config: {
      icon: '💅',
      posMode: 'services',
      defaultTaxRate: 0.19,
      modules: ['pos', 'inventory', 'employees'],
      features: [
        'Servicios + productos para reventa',
        'Asignación por estilista y comisiones',
        'Categorías: Cortes, Colorimetría, Manicure...',
        'Historial de servicios por cliente',
      ],
    },
  },
  {
    slug: 'stationery',
    name: 'Papelería / Miscelánea',
    description: 'Para papelerías, misceláneas y tiendas de variedades.',
    config: {
      icon: '📚',
      posMode: 'retail',
      defaultTaxRate: 0.19,
      modules: ['pos', 'inventory', 'customers'],
      features: [
        'IVA diferenciado: 0% útiles, 19% tecnología',
        'Variantes por tamaño y color',
        'Categorías: Escolares, Oficina, Tecnología...',
        'Clientes frecuentes y descuentos por volumen',
      ],
    },
  },
];

function TaxBadge({ rate }: { rate: number }) {
  if (rate === 0) {
    return (
      <span
        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
        style={{ background: 'var(--success-bg)', color: 'var(--success-text)' }}
      >
        IVA 0%
      </span>
    );
  }
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ background: 'var(--bg-subtle)', color: 'var(--text-tertiary)' }}
    >
      IVA {(rate * 100).toFixed(0)}%
    </span>
  );
}

export function StepBusiness({ data, onNext, onBack }: Props) {
  const [businessName, setBusinessName] = useState(data.businessName ?? '');
  const [businessType, setBusinessType] = useState(data.businessType ?? '');
  const [phone, setPhone] = useState(data.phone ?? '');
  const [templates, setTemplates] = useState<BusinessTemplate[]>(FALLBACK_TEMPLATES);
  const [expanded, setExpanded] = useState<string | null>(null);

  const canContinue = businessName.trim().length >= 2 && businessType !== '' && phone.trim().length >= 7;

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    fetch(`${apiUrl}/onboarding/templates`)
      .then((r) => r.json())
      .then((data: BusinessTemplate[]) => {
        if (Array.isArray(data) && data.length > 0) setTemplates(data);
      })
      .catch(() => {/* use fallback */});
  }, []);

  const selectedTemplate = templates.find((t) => t.slug === businessType);

  return (
    <div>
      <h2
        className="text-2xl font-display font-semibold mb-1"
        style={{ color: 'var(--text-primary)' }}
      >
        Tu negocio
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Elige el tipo de negocio — configuraremos todo automáticamente para ti.
      </p>

      {/* Template grid */}
      <div className="mb-6 space-y-2">
        {templates.map((t) => {
          const isSelected = businessType === t.slug;
          const isExpanded = expanded === t.slug;

          return (
            <div
              key={t.slug}
              className="rounded-xl overflow-hidden transition-all"
              style={{
                border: isSelected
                  ? '2px solid var(--gold-500)'
                  : '2px solid var(--border-default)',
                background: isSelected ? 'var(--gold-50)' : 'var(--bg-surface)',
                boxShadow: isSelected ? 'var(--shadow-gold)' : 'none',
              }}
            >
              {/* Header row */}
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                onClick={() => {
                  setBusinessType(t.slug);
                  setExpanded(isExpanded ? null : t.slug);
                }}
              >
                <span className="text-2xl flex-shrink-0">{t.config.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: isSelected ? 'var(--gold-700)' : 'var(--text-primary)' }}
                    >
                      {t.name}
                    </span>
                    <TaxBadge rate={t.config.defaultTaxRate} />
                  </div>
                  <p
                    className="text-xs mt-0.5 truncate"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {t.description}
                  </p>
                </div>
                <span
                  className="text-xs flex-shrink-0 ml-1 transition-transform duration-200"
                  style={{
                    color: 'var(--text-tertiary)',
                    transform: isExpanded ? 'rotate(180deg)' : 'none',
                  }}
                >
                  ▾
                </span>
              </button>

              {/* Expanded features */}
              {isExpanded && (
                <div
                  className="px-4 pb-4 pt-0"
                  style={{ borderTop: '1px solid var(--border-default)' }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-wider mb-2 mt-3"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Qué incluye esta plantilla
                  </p>
                  <ul className="space-y-1.5">
                    {t.config.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 flex-shrink-0 text-xs" style={{ color: 'var(--gold-500)' }}>
                          ✓
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Business name */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
          Nombre del negocio *
        </label>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder={selectedTemplate ? `Ej: Mi ${selectedTemplate.name.split('/')[0].trim()}` : 'Ej: Boutique La Moda'}
          maxLength={80}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
          style={{
            border: '1.5px solid var(--border-default)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--gold-500)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
        />
      </div>

      {/* Phone */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
          Teléfono del negocio *
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Ej: 3001234567"
          maxLength={15}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
          style={{
            border: '1.5px solid var(--border-default)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--gold-500)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
          style={{
            border: '1.5px solid var(--border-default)',
            color: 'var(--text-secondary)',
            background: 'transparent',
          }}
        >
          ← Atrás
        </button>
        <button
          type="button"
          onClick={() => onNext({ businessName: businessName.trim(), businessType, phone: phone.trim() })}
          disabled={!canContinue}
          className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
          style={{ background: 'var(--text-primary)', color: '#F7F6F3' }}
        >
          Continuar →
        </button>
      </div>
    </div>
  );
}
