'use client';

import { useEffect, useRef, useState } from 'react';

interface BarcodeScannerModalProps {
  open: boolean;
  onClose: () => void;
  onDetected: (value: string) => void;
}

export function BarcodeScannerModal({
  open,
  onClose,
  onDetected,
}: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const stopStream = () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };

    const scan = async () => {
      const Detector = (window as Window & {
        BarcodeDetector?: new (...args: unknown[]) => {
          detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
        };
      }).BarcodeDetector;

      if (!Detector || !videoRef.current) {
        setError('Este navegador no soporta escaneo por cámara. Usa un lector Bluetooth o escribe el código.');
        return;
      }

      try {
        const detector = new Detector({
          formats: ['ean_13', 'ean_8', 'code_128', 'upc_a', 'upc_e', 'qr_code'],
        });

        const loop = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const results = await detector.detect(videoRef.current);
            const code = results[0]?.rawValue?.trim();
            if (code) {
              onDetected(code);
              onClose();
              return;
            }
          } catch {
            // ignore transient detector errors
          }
          timeoutId = setTimeout(() => void loop(), 350);
        };

        void loop();
      } catch {
        setError('No fue posible iniciar el detector de códigos.');
      }
    };

    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        await scan();
      } catch {
        setError('No se pudo acceder a la cámara.');
      }
    })();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      stopStream();
    };
  }, [onClose, onDetected, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="barcode-scanner-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-[--radius-xl] bg-[--bg-primary] shadow-[--shadow-lg]">
        <div className="flex items-center justify-between border-b border-[--border] px-4 py-3">
          <div>
            <h2 id="barcode-scanner-title" className="font-semibold text-[--text-primary]">
              Escanear código de barras
            </h2>
            <p className="text-sm text-[--text-secondary]">
              Apunta la cámara al producto.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-[--radius-sm] px-2 py-1 text-[--text-tertiary] hover:bg-[--bg-tertiary]"
            aria-label="Cerrar escáner"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 p-4">
          <div className="relative overflow-hidden rounded-[--radius-lg] bg-black">
            <video
              ref={videoRef}
              className="aspect-video w-full object-cover"
              muted
              playsInline
            />
            <div className="pointer-events-none absolute inset-0 border-[3px] border-dashed border-white/60" />
          </div>

          {error ? (
            <div className="rounded-[--radius-md] bg-yellow-50 px-3 py-2 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
              {error}
            </div>
          ) : (
            <p className="text-sm text-[--text-secondary]">
              Si usas lector Bluetooth, también puedes escanear directamente sobre el buscador.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
