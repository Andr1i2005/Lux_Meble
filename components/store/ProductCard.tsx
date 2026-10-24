import { Link } from "@/i18n/navigation";
import { productImage, type ProductConfig } from "@/lib/product-catalog";
import { assetUrl } from "@/lib/asset-url";
import Price from "./Price";

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ProductCard({ product }: { product: ProductConfig }) {
  const image = productImage(product);

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-neutral-100 hover:border-neutral-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
    >
      <div
        className="relative h-56 flex items-center justify-center overflow-hidden"
        style={{ background: `radial-gradient(ellipse at 42% 58%, ${product.accentColor}1f 0%, ${product.accentColor}08 55%, #f5f5f5 100%)` }}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={assetUrl(image)} alt={product.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500" draggable={false} />
        ) : (
          <div className="w-28 h-14 rounded-xl opacity-60 group-hover:opacity-80 transition-opacity" style={{ background: product.accentColor }} />
        )}
        {product.modelType === "gltf" && (
          <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-1 rounded-full bg-white/80 backdrop-blur-sm text-neutral-600 border border-neutral-200">
            3D
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-5">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-neutral-400 mb-1">{product.categoryLabel}</span>
        <h3 className="text-base font-semibold text-neutral-900 leading-tight">{product.name}</h3>
        <p className="text-xs text-neutral-500 mt-1">{product.subtitle}</p>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
          <div>
            <span className="text-[11px] text-neutral-400">From </span>
            <span className="text-sm font-bold text-neutral-900"><Price value={product.startingPrice} /></span>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900 group-hover:gap-2.5 transition-all">
            View <ArrowIcon />
          </span>
        </div>
      </div>
    </Link>
  );
}
