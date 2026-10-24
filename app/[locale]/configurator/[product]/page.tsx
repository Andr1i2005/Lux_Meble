import { notFound } from "next/navigation";
import { getProduct, getFabricOptions, getLegOptions, getSofaModules } from "@/lib/catalog";
import { productCatalog } from "@/lib/product-catalog";
import ConfiguratorPage from "@/components/ConfiguratorPage";

interface Props {
  params: Promise<{ product: string }>;
}

export default async function ProductConfiguratorPage({ params }: Props) {
  const { product: slug } = await params;
  const [product, fabrics, legs, modules] = await Promise.all([
    getProduct(slug),
    getFabricOptions(),
    getLegOptions(),
    getSofaModules(),
  ]);
  if (!product) notFound();

  return <ConfiguratorPage product={product} fabrics={fabrics} legs={legs} modules={modules} />;
}

export async function generateStaticParams() {
  return productCatalog.filter((p) => p.configurable).map((p) => ({ product: p.slug }));
}
