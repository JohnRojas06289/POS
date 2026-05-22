'use client';

import React from 'react';

export interface ReceiptData {
  txId: string;
  createdAt: string; // ISO string
  businessName: string;
  branchName?: string;
  items: Array<{
    productName: string;
    variantName: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
  }>;
  payments: Array<{ method: string; amount: number }>;
  subtotal: number;
  itemDiscountTotal: number;
  cartDiscountAmount: number;
  tipAmount?: number;
  tipPercentage?: number;
  total: number;
  change: number;
}

interface ReceiptProps {
  data: ReceiptData;
  onClose: () => void;
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  transfer: 'Transferencia',
  credit_store: 'Fiado',
};

function formatCOP(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(n);
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

export function Receipt({ data, onClose }: ReceiptProps) {
  const {
    txId,
    createdAt,
    businessName,
    branchName,
    items,
    payments,
    subtotal,
    itemDiscountTotal,
    cartDiscountAmount,
    tipAmount = 0,
    total,
    change,
  } = data;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const lines: string[] = [
      `*${businessName}* 🛍️`,
      `Recibo de venta #${txId}`,
      `📅 ${formatDateShort(createdAt)} ${formatTime(createdAt)}`,
      '',
      '*Productos:*',
      ...items.map(
        (item) =>
          `• ${item.quantity}x ${item.productName} (${item.variantName}) - ${formatCOP(item.unitPrice)}`,
      ),
      '─────────────────',
      `*Total: ${formatCOP(total)}*`,
    ];

    if (change > 0) {
      lines.push(`Vuelto: ${formatCOP(change)}`);
    }

    lines.push('', 'Gracias por tu compra 🙏');

    const text = lines.join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const totalDiscounts = itemDiscountTotal + cartDiscountAmount;

  return (
    <>
      {/* Print styles injected into the page */}
      <style>{`
        @media print {
          body { background: #111111 !important; }
          body > * { visibility: hidden !important; }
          .nexus-receipt-print, .nexus-receipt-print * { visibility: visible !important; }
          .nexus-receipt-print {
            display: block !important;
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .nexus-receipt-no-print { display: none !important; }
        }
      `}</style>

      <div
        className="nexus-receipt-print"
        style={{
          background: '#111111',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '24px',
          width: '100%',
          maxWidth: '420px',
          margin: '0 auto',
          color: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
            Comprobante de venta
          </p>
          <h2 style={{ color: '#C9A84C', fontSize: '20px', fontWeight: 700, margin: 0 }}>
            {businessName}
          </h2>
          {branchName && (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '2px 0 0' }}>
              {branchName}
            </p>
          )}
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '6px' }}>
            {formatDateShort(createdAt)} · {formatTime(createdAt)}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginTop: '2px' }}>
            #{txId}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
            <span style={{ padding: '4px 8px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>
              {items.length} items
            </span>
            <span style={{ padding: '4px 8px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>
              {payments.length} pagos
            </span>
            <span style={{ padding: '4px 8px', borderRadius: '999px', border: '1px solid rgba(201,168,76,0.18)', background: 'rgba(201,168,76,0.08)', fontSize: '10px', color: '#C9A84C' }}>
              Total {formatCOP(total)}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginBottom: '16px' }} />

        {/* Items */}
        <div style={{ marginBottom: '16px' }}>
          {items.map((item, idx) => (
            <div key={idx} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, marginRight: '8px' }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                    {item.productName}
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                    {item.variantName}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                    {item.quantity} × {formatCOP(item.unitPrice)}
                  </p>
                  {item.discountAmount > 0 && (
                    <p style={{ margin: 0, fontSize: '11px', color: '#34D399' }}>
                      -{formatCOP(item.discountAmount)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginBottom: '16px' }} />

        {/* Totals */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Subtotal</span>
            <span style={{ fontSize: '13px', color: '#ffffff' }}>{formatCOP(subtotal)}</span>
          </div>
          {totalDiscounts > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', color: '#34D399' }}>Descuentos</span>
              <span style={{ fontSize: '13px', color: '#34D399' }}>-{formatCOP(totalDiscounts)}</span>
            </div>
          )}
          {tipAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', color: '#C9A84C' }}>Propina</span>
              <span style={{ fontSize: '13px', color: '#C9A84C' }}>{formatCOP(tipAmount)}</span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              paddingTop: '10px',
              marginTop: '8px',
            }}
          >
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#C9A84C' }}>TOTAL</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#C9A84C' }}>{formatCOP(total)}</span>
          </div>
        </div>

        {/* Payments */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Métodos de pago
          </p>
          {payments.map((p, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                {METHOD_LABELS[p.method] ?? p.method}
              </span>
              <span style={{ fontSize: '13px', color: '#ffffff' }}>{formatCOP(p.amount)}</span>
            </div>
          ))}
          {change > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '6px',
                padding: '6px 10px',
                background: 'rgba(52,211,153,0.1)',
                borderRadius: '6px',
                border: '1px solid rgba(52,211,153,0.2)',
              }}
            >
              <span style={{ fontSize: '13px', color: '#34D399', fontWeight: 600 }}>Vuelto</span>
              <span style={{ fontSize: '13px', color: '#34D399', fontWeight: 600 }}>{formatCOP(change)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>
            NEXUS POS · nexuspos.co
          </p>
        </div>

        {/* Action buttons */}
        <div className="nexus-receipt-no-print" style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handlePrint}
            style={{
              flex: 1,
              padding: '10px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🖨️ Imprimir
          </button>
          <button
            onClick={handleWhatsApp}
            style={{
              flex: 1,
              padding: '10px',
              background: 'rgba(37,211,102,0.12)',
              border: '1px solid rgba(37,211,102,0.3)',
              borderRadius: '8px',
              color: '#25D366',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            WhatsApp
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '10px 14px',
              background: 'rgba(201,168,76,0.12)',
              border: '1px solid rgba(201,168,76,0.3)',
              borderRadius: '8px',
              color: '#C9A84C',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Nueva venta
          </button>
        </div>
      </div>
    </>
  );
}
