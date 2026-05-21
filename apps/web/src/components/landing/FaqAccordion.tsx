'use client';

import { useState } from 'react';

interface FaqItem {
  q: string;
  a: string;
}

const FAQ: FaqItem[] = [
  {
    q: '¿Necesito hardware especial para usar NEXUS?',
    a: 'No. NEXUS funciona en cualquier dispositivo con navegador web: computadores, tablets y celulares. Para imprimir recibos puedes usar cualquier impresora térmica compatible con tu sistema operativo. No hay costos de hardware obligatorios.',
  },
  {
    q: '¿Qué pasa si se va el internet en mi negocio?',
    a: 'NEXUS continúa funcionando sin conexión. El catálogo de productos se guarda localmente y puedes seguir registrando ventas. Cuando recuperes la conexión, las ventas pendientes se sincronizan automáticamente con el servidor.',
  },
  {
    q: '¿Cómo funciona el plan gratuito? ¿Tiene límite de tiempo?',
    a: 'El plan Starter es gratuito para siempre, sin tarjeta de crédito. Incluye hasta 50 productos, 1 usuario y funcionalidades básicas de POS e inventario. Puedes actualizar a un plan de pago en cualquier momento desde la configuración.',
  },
  {
    q: '¿Mis datos están seguros? ¿Quién tiene acceso a la información de mi negocio?',
    a: 'Cada negocio opera en un esquema de base de datos completamente aislado (arquitectura multi-tenant). Nadie más puede acceder a tus datos. Usamos cifrado en tránsito (HTTPS) y en reposo. Cumplimos con las mejores prácticas de seguridad de la industria.',
  },
  {
    q: '¿Puedo tener múltiples sucursales o terminales?',
    a: 'Sí. Los planes Growth y Enterprise incluyen múltiples sucursales con inventario independiente por sede. Cada caja registradora es un terminal separado con su propio cierre de caja diario. Los reportes pueden verse consolidados o por sucursal.',
  },
  {
    q: '¿NEXUS funciona para mi tipo de negocio?',
    a: 'NEXUS está diseñado para comercio minorista colombiano: ropa y accesorios, abarrotes, restaurantes, farmacias, ferreterías, salones de belleza, papelerías y más. Si tu negocio vende productos físicos o servicios y necesita llevar inventario, NEXUS funciona.',
  },
  {
    q: '¿Puedo importar mis productos existentes?',
    a: 'Sí. Puedes importar productos desde un archivo CSV con nombre, código de barras, precio, costo y stock inicial. También puedes crear productos manualmente o usar el escáner del celular para registrar por código de barras.',
  },
  {
    q: '¿Cómo funciona el Agente IA?',
    a: 'El Agente IA es un asistente integrado que entiende preguntas en lenguaje natural sobre tu negocio. Puedes preguntarle "¿cuánto vendí esta semana?", "¿qué productos están por agotarse?" o "¿cuál es mi margen promedio?". Responde con datos reales de tu negocio en tiempo real.',
  },
  {
    q: '¿Qué métodos de pago soporta?',
    a: 'Efectivo, tarjeta débito/crédito, Nequi, Daviplata, transferencia bancaria y crédito de la tienda (fiado). Puedes registrar pagos mixtos (por ejemplo: mitad efectivo, mitad Nequi) en una sola venta.',
  },
  {
    q: '¿Puedo cancelar en cualquier momento?',
    a: 'Sí. No hay contratos ni penalidades por cancelar. Si cancelas un plan de pago, tu cuenta pasa automáticamente al plan gratuito y conservas todos tus datos históricos.',
  },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
      {FAQ.map((item, i) => (
        <div key={i}>
          <button
            className="w-full flex items-center justify-between gap-4 py-5 text-left transition-colors"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span
              className="text-sm font-medium leading-relaxed"
              style={{ color: open === i ? 'var(--gold-500)' : 'var(--text-primary)' }}
            >
              {item.q}
            </span>
            <span
              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-transform"
              style={{
                background: open === i ? 'var(--gold-500)' : 'var(--bg-subtle)',
                transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)',
                transition: 'transform 200ms ease, background 200ms ease',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M5 1v8M1 5h8"
                  stroke={open === i ? '#0A0A0A' : 'var(--text-secondary)'}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </button>
          {open === i && (
            <div className="pb-5">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {item.a}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
