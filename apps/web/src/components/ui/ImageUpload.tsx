'use client';

import { useRef, useState } from 'react';

interface Props {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}

async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary no configurado');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error('Error al subir imagen');

  const data = (await res.json()) as { secure_url: string };
  return data.secure_url;
}

export function ImageUpload({ value, onChange, className = '' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5 MB');
      return;
    }

    setError('');
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      onChange(url);
    } catch {
      setError('Error al subir. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      {value ? (
        /* Preview */
        <div className="relative group">
          <img
            src={value}
            alt="Imagen del producto"
            className="w-full h-32 object-cover rounded-lg border border-[--border]"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 bg-white rounded-md text-xs font-medium text-gray-800"
            >
              Cambiar
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1.5 bg-red-500 rounded-md text-xs font-medium text-white"
            >
              Quitar
            </button>
          </div>
        </div>
      ) : (
        /* Drop zone */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          disabled={uploading}
          className="w-full h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
          style={{ borderColor: 'var(--border-default)', background: 'var(--bg-subtle)' }}
        >
          {uploading ? (
            <>
              <div
                className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'var(--gold-300)', borderTopColor: 'var(--gold-500)' }}
              />
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Subiendo...
              </span>
            </>
          ) : (
            <>
              <span className="text-xl">🖼️</span>
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Clic o arrastra una imagen
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                JPG, PNG, WEBP · máx 5 MB
              </span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="mt-1 text-xs" style={{ color: 'var(--danger-text)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
