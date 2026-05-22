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
  description?: string | null;
  categoryId?: string | null;
  imageUrl?: string | null;
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
    const data = await res.json();
    const rawProducts = Array.isArray(data) ? data : (data as { data?: Product[] })?.data ?? [];

    return rawProducts.map((product) => ({
      ...product,
      variants: Array.isArray(product.variants)
        ? product.variants.map((variant) => ({
            ...variant,
            unitPrice: Number(variant.unitPrice),
            stock: Number(variant.stock),
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
