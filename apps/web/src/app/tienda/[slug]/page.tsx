import { notFound } from 'next/navigation';
import { PublicCatalogClient } from '../../../components/catalog/PublicCatalogClient';

// ─── Types ────────────────────────────────────────────────────

interface BusinessInfo {
  name: string;
  whatsapp?: string | null;
  country: string;
  currency: string;
  businessType: string;
  posMode: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  imageUrl: string | null;
  hasVariants: boolean;
  variants: Array<{
    id: string;
    sku: string;
    name: string;
    attributes: Record<string, unknown>;
    unitPrice: number;
    stock: number;
  }>;
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
    const data = await res.json() as unknown;
    const rawProducts = Array.isArray(data)
      ? data as Array<Record<string, unknown>>
      : Array.isArray((data as { data?: unknown[] })?.data)
        ? ((data as { data: unknown[] }).data as Array<Record<string, unknown>>)
        : [];

    return rawProducts.map((product) => ({
      id: String(product.id ?? ''),
      name: String(product.name ?? 'Producto'),
      description: product.description == null ? null : String(product.description),
      categoryId: product.categoryId == null ? null : String(product.categoryId),
      imageUrl: product.imageUrl == null ? null : String(product.imageUrl),
      hasVariants: Boolean(product.hasVariants),
      variants: Array.isArray(product.variants)
        ? (product.variants as Array<Record<string, unknown>>).map((variant) => ({
            id: String(variant.id ?? ''),
            sku: String(variant.sku ?? ''),
            name: String(variant.name ?? 'Variante'),
            attributes: typeof variant.attributes === 'object' && variant.attributes !== null
              ? variant.attributes as Record<string, unknown>
              : {},
            unitPrice: Number(variant.unitPrice ?? 0),
            stock: Number(variant.stock ?? 0),
          }))
        : [],
    }));
  } catch {
    return [];
  }
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

  return <PublicCatalogClient info={info} products={products} />;
}

// ─── Metadata ─────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const info = await fetchBusinessInfo(slug);
  if (!info) return { title: 'Negocio no encontrado' };
  return {
    title: `${info.name} — Catálogo`,
    description: `Catálogo de productos de ${info.name}`,
  };
}
