import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/catalog";
import { productCatalog } from "@/lib/product-catalog";
import SiteHeader from "@/components/store/SiteHeader";
import ProductDetail from "@/components/store/ProductDetail";

interface Props {
  params: Promise<{ slug: string }>;
}

// Pre-render the built-in slugs; admin-added products render on demand.
export async function generateStaticParams() {
  return productCatalog.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  return { title: product ? `${product.name} — LuxMeble` : "LuxMeble" };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const related = (await getProducts()).filter((p) => p.slug !== product.slug).slice(0, 4);

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <ProductDetail product={product} related={related} />
    </div>
  );
}
