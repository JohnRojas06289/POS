import { notFound } from 'next/navigation';
import Image from 'next/image';

// ─── Types ────────────────────────────────────────────────────

interface BusinessInfo {
  name: string;
  city?: string | null;
  whatsapp?: string | null;
  logoUrl?: string | null;
  description?: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock?: number | null;
  imageUrl?: string | null;
  description?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

async function fetchBusinessInfo(slug: string): Promise<BusinessInfo | null> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${base}/catalog/${slug}/info`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json() as Promise<BusinessInfo>;
  } catch {
    return null;
  }
}

async function fetchProducts(slug: string): Promise<Product[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${base}/catalog/${slug}/products`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data as { data?: Product[] })?.data ?? [];
  } catch {
    return [];
  }
}

// ─── Product Card ─────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative h-48 bg-gray-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-gray-300">
              <rect x="4" y="4" width="40" height="40" rx="8" stroke="currentColor" strokeWidth="2" />
              <circle cx="18" cy="18" r="5" stroke="currentColor" strokeWidth="2" />
              <path d="M4 32 L14 22 L22 30 L30 20 L44 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <p className="text-lg font-bold text-gray-900">{fmt(product.price)}</p>
          {product.stock != null && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${product.stock > 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
              {product.stock > 0 ? `${product.stock} en stock` : 'Agotado'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default async function CatalogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [info, products] = await Promise.all([
    fetchBusinessInfo(slug),
    fetchProducts(slug),
  ]);

  if (!info) {
    notFound();
  }

  const waLink = info.whatsapp
    ? `https://wa.me/${info.whatsapp.replace(/\D/g, '')}`
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Business header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {info.logoUrl && (
              <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                <Image src={info.logoUrl} alt={info.name} fill className="object-cover" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{info.name}</h1>
              {info.city && <p className="text-sm text-gray-500 mt-0.5">{info.city}</p>}
              {info.description && <p className="text-sm text-gray-600 mt-1 max-w-md">{info.description}</p>}
            </div>
          </div>

          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-[#20b558] transition-colors"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Escribir por WhatsApp
            </a>
          )}
        </div>
      </header>

      {/* Product grid */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No hay productos disponibles</p>
            <p className="text-gray-400 text-sm mt-1">Vuelve pronto</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">{products.length} producto{products.length !== 1 ? 's' : ''}</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between flex-wrap gap-4">
          <p className="text-xs text-gray-400">
            Powered by{' '}
            <a href="https://nexuspos.co" target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              Nexus POS
            </a>
          </p>
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#25D366] border border-[#25D366]/30 rounded-lg hover:bg-green-50 transition-colors"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Contactar por WhatsApp
            </a>
          )}
        </div>
      </footer>
    </div>
  );
}

// ─── Metadata ─────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const info = await fetchBusinessInfo(slug);
  if (!info) return { title: 'Negocio no encontrado' };
  return {
    title: `${info.name} — Catálogo`,
    description: info.description ?? `Catálogo de productos de ${info.name}`,
  };
}
