'use client';

import React, { useState, useEffect } from 'react';
import { cashApi } from '../../lib/api';

interface CashSessionSummary {
  id: string;
  openingAmount: number;
  expectedCash: number;
  totalSales: number;
  byMethod: Array<{ method: string; total: number; count: number }>;
  refundTotal: number;
  openedAt: string;
}

interface CashSessionModalProps {
  mode: 'open' | 'close';
  sessionId?: string;
  terminalId: string;
  onSuccess: (sessionId?: string) => void;
  onCancel?: () => void;
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

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Open mode ────────────────────────────────────────────────

function OpenCashSession({ terminalId, onSuccess }: { terminalId: string; onSuccess: (id: string) => void }) {
  const [openingAmount, setOpeningAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = (await cashApi.openSession({
        terminalId,
        openingAmount: parseFloat(openingAmount.replace(/\D/g, '')) || 0,
      })) as { id: string };
      onSuccess(result.id);
    } catch {
      setError('No se pudo abrir la caja. Intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: '16px',
          padding: '32px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏦</div>
        <h2
          style={{
            margin: '0 0 8px',
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          Abrir Caja
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Cuenta el efectivo inicial en caja antes de empezar
        </p>

        <div style={{ textAlign: 'left', marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '6px',
            }}
          >
            Monto inicial en efectivo
          </label>
          <input
            type="number"
            value={openingAmount}
            onChange={(e) => setOpeningAmount(e.target.value)}
            placeholder="0"
            min={0}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '16px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--gold-500)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
          />
        </div>

        {error && (
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#F09595' }}>{error}</p>
        )}

        <button
          onClick={() => void handleOpen()}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: loading ? 'rgba(201,168,76,0.4)' : 'var(--gold-500)',
            border: 'none',
            borderRadius: '8px',
            color: '#1A1400',
            fontSize: '15px',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {loading ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75" />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </svg>
          ) : (
            'Abrir Caja ✓'
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Close mode ───────────────────────────────────────────────

function CloseCashSession({
  sessionId,
  onSuccess,
  onCancel,
}: {
  sessionId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [summary, setSummary] = useState<CashSessionSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [closingAmount, setClosingAmount] = useState('');
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cashApi
      .getSessionSummary(sessionId)
      .then((data: unknown) => setSummary(data as CashSessionSummary))
      .catch(() => setError('No se pudo cargar el resumen de caja.'))
      .finally(() => setSummaryLoading(false));
  }, [sessionId]);

  const closingNum = parseFloat(closingAmount.replace(/\D/g, '')) || 0;
  const expectedCash = summary?.expectedCash ?? 0;
  const difference = closingNum - expectedCash;

  const handleClose = async () => {
    setClosing(true);
    setError(null);
    try {
      await cashApi.closeSession(sessionId, { closingCash: closingNum });
      onSuccess();
    } catch {
      setError('No se pudo cerrar la caja. Intenta de nuevo.');
      setClosing(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: '16px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Cierre de Caja
            </h2>
            {summary?.openedAt && (
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                Abierta: {formatDateTime(summary.openedAt)}
              </p>
            )}
          </div>
          <button
            onClick={onCancel}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {summaryLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75" />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </svg>
              <p style={{ marginTop: '12px' }}>Cargando resumen...</p>
            </div>
          ) : error && !summary ? (
            <p style={{ color: '#F09595', textAlign: 'center' }}>{error}</p>
          ) : summary ? (
            <>
              {/* Sales by method */}
              <div style={{ marginBottom: '20px' }}>
                <p
                  style={{
                    margin: '0 0 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Ventas por método
                </p>
                {summary.byMethod.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.03)',
                      marginBottom: '4px',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {METHOD_LABELS[m.method] ?? m.method}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
                        {m.count} {m.count === 1 ? 'transacción' : 'transacciones'}
                      </span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#C9A84C' }}>
                      {formatCOP(m.total)}
                    </span>
                  </div>
                ))}

                {/* Total sales */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderTop: '1px solid var(--border-default)',
                    marginTop: '8px',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Total ventas
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#C9A84C' }}>
                    {formatCOP(summary.totalSales)}
                  </span>
                </div>

                {/* Refunds */}
                {summary.refundTotal > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                    }}
                  >
                    <span style={{ fontSize: '13px', color: '#F09595' }}>Reembolsos</span>
                    <span style={{ fontSize: '13px', color: '#F09595' }}>
                      -{formatCOP(summary.refundTotal)}
                    </span>
                  </div>
                )}
              </div>

              {/* Expected cash */}
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(201,168,76,0.06)',
                  border: '1px solid rgba(201,168,76,0.2)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Efectivo esperado en caja
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#C9A84C' }}>
                  {formatCOP(expectedCash)}
                </span>
              </div>

              {/* Closing amount input */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '6px',
                  }}
                >
                  Efectivo contado físicamente
                </label>
                <input
                  type="number"
                  value={closingAmount}
                  onChange={(e) => setClosingAmount(e.target.value)}
                  placeholder="0"
                  min={0}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--gold-500)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                />
              </div>

              {/* Difference */}
              {closingAmount !== '' && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background:
                      difference >= 0 ? 'rgba(52,211,153,0.08)' : 'rgba(240,149,149,0.08)',
                    border: `1px solid ${difference >= 0 ? 'rgba(52,211,153,0.25)' : 'rgba(240,149,149,0.25)'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: difference >= 0 ? '#34D399' : '#F09595',
                    }}
                  >
                    {difference >= 0 ? 'Sobrante' : 'Faltante'}
                  </span>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: difference >= 0 ? '#34D399' : '#F09595',
                    }}
                  >
                    {difference >= 0 ? '+' : ''}{formatCOP(difference)}
                  </span>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        {!summaryLoading && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-default)',
              display: 'flex',
              gap: '10px',
            }}
          >
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '10px',
                background: 'transparent',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() => void handleClose()}
              disabled={closing || !summary}
              style={{
                flex: 2,
                padding: '10px',
                background: closing || !summary ? 'rgba(240,149,149,0.3)' : '#F09595',
                border: 'none',
                borderRadius: '8px',
                color: '#1A0000',
                fontSize: '14px',
                fontWeight: 700,
                cursor: closing || !summary ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {closing ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75" />
                </svg>
              ) : (
                'Cerrar Caja'
              )}
            </button>
          </div>
        )}

        {error && summary && (
          <p style={{ margin: '0 24px 16px', fontSize: '13px', color: '#F09595' }}>{error}</p>
        )}
      </div>
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────

export function CashSessionModal({
  mode,
  sessionId,
  terminalId,
  onSuccess,
  onCancel,
}: CashSessionModalProps) {
  if (mode === 'open') {
    return (
      <OpenCashSession
        terminalId={terminalId}
        onSuccess={(id) => onSuccess(id)}
      />
    );
  }

  if (!sessionId) return null;

  return (
    <CloseCashSession
      sessionId={sessionId}
      onSuccess={() => onSuccess()}
      onCancel={onCancel ?? (() => undefined)}
    />
  );
}
