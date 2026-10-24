"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { getProduct, type ProductConfig } from "@/lib/product-catalog";
import { assetUrl } from "@/lib/asset-url";
import Price from "./Price";

type Resolve = (slug: string) => ProductConfig | undefined;

type Align = "left" | "center" | "right";

interface Spot {
  slug: string;
  x: number; // % from left
  y: number; // % from top
  align: Align;
}

interface Look {
  id: string;
  label: string;
  image: string;
  spots: Spot[];
}

// Positions tuned to the items in each interior photo.
const LOOKS: Look[] = [
  {
    id: "living-room",
    label: "The living room",
    image: "/products/interior.jpg",
    spots: [
      { slug: "nordvik-sofa",  x: 58, y: 56, align: "center" },
      { slug: "oslo-armchair", x: 17, y: 64, align: "left" },
    ],
  },
  {
    id: "lounge",
    label: "The lounge",
    image: "/products/interior-lounge.jpg",
    spots: [
      { slug: "brando-leather-sofa", x: 50, y: 66, align: "center" },
      { slug: "margaux-accent-chair", x: 71, y: 74, align: "right" },
      { slug: "arc-floor-lamp",      x: 81, y: 44, align: "right" },
    ],
  },
];

const alignClass: Record<Align, string> = {
  left: "left-0",
  center: "left-1/2 -translate-x-1/2",
  right: "right-0",
};

function Hotspot({ spot, resolve }: { spot: Spot; resolve: Resolve }) {
  const [open, setOpen] = useState(false);
  const product = resolve(spot.slug);
  if (!product) return null;

  const image = product.photo ?? product.thumbnail ?? product.variants?.find((v) => v.thumbnail)?.thumbnail;
  const onGradient = !product.photo;

  return (
    <div
      className="absolute"
      style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-label={`Show ${product.name}`}
        className={`relative -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ring-1 ring-black/5 transition-all duration-300 ${
          open ? "bg-neutral-900 text-white rotate-45 scale-110" : "bg-white/95 text-neutral-900 hover:scale-110"
        }`}
      >
        {!open && <span className="absolute w-8 h-8 rounded-full bg-white/50 animate-ping" />}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="relative">
          <path d="M7 2.5v9M2.5 7h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      <div
        className={`absolute bottom-full mb-3 w-56 transition-all duration-200 ${alignClass[spot.align]} ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-1 pointer-events-none"
        }`}
      >
        <Link
          href={`/product/${product.slug}`}
          className="block bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden hover:shadow-2xl transition-shadow"
        >
          <div
            className="h-28 flex items-center justify-center overflow-hidden"
            style={onGradient ? { background: `radial-gradient(ellipse at 50% 60%, ${product.accentColor}1f 0%, #f3f3f3 100%)` } : undefined}
          >
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={assetUrl(image)} alt={product.name} className={onGradient ? "w-[80%] h-[80%] object-contain" : "w-full h-full object-cover"} />
            )}
          </div>
          <div className="p-3">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-neutral-400">{product.categoryLabel}</p>
            <p className="text-sm font-semibold text-neutral-900 leading-tight mt-0.5">{product.name}</p>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-neutral-500">From <span className="font-bold text-neutral-900"><Price value={product.startingPrice} /></span></span>
              <span className="text-xs font-semibold text-neutral-900">View →</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

function RoomProduct({ slug, resolve }: { slug: string; resolve: Resolve }) {
  const product = resolve(slug);
  if (!product) return null;
  const image = product.photo ?? product.thumbnail ?? product.variants?.find((v) => v.thumbnail)?.thumbnail;
  const onGradient = !product.photo;
  return (
    <Link href={`/product/${product.slug}`} className="group flex items-center gap-3 w-full rounded-2xl border border-neutral-100 hover:border-neutral-300 hover:bg-neutral-50/60 transition-all p-2.5">
      <span className="w-14 h-14 rounded-xl shrink-0 overflow-hidden flex items-center justify-center bg-neutral-50" style={onGradient ? { background: `${product.accentColor}14` } : undefined}>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={assetUrl(image)} alt={product.name} className={onGradient ? "w-[85%] h-[85%] object-contain" : "w-full h-full object-cover"} />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-semibold tracking-widest uppercase text-neutral-400">{product.categoryLabel}</span>
        <span className="block text-sm font-semibold text-neutral-900 truncate leading-tight mt-0.5">{product.name}</span>
        <span className="block text-xs text-neutral-500 mt-0.5">From <Price value={product.startingPrice} /></span>
      </span>
      <span className="shrink-0 text-neutral-300 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-all">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    </Link>
  );
}

export default function ShopTheLook({ products }: { products?: ProductConfig[] }) {
  const [active, setActive] = useState(0);
  const look = LOOKS[active];

  // Resolve product slugs from the Firebase-fetched list, falling back to static.
  const lookup = useMemo(
    () => (products ? new Map(products.map((p) => [p.slug, p])) : null),
    [products],
  );
  const resolve: Resolve = (slug) => lookup?.get(slug) ?? getProduct(slug);

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 py-16">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-2">Featured collections</p>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900">Shop the look</h2>
          <p className="text-sm text-neutral-500 mt-1">Tap the markers to explore each piece in the room.</p>
        </div>
        <div className="flex gap-2">
          {LOOKS.map((l, i) => (
            <button
              key={l.id}
              onClick={() => setActive(i)}
              className={`px-4 h-9 rounded-full text-sm font-medium border transition-all ${
                i === active ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5 lg:gap-6 items-start">
        {/* Room image with hotspots */}
        <div className="relative overflow-hidden rounded-3xl ring-1 ring-black/5 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={look.id} src={assetUrl(look.image)} alt={look.label} className="block w-full h-auto" />
          {look.spots.map((spot) => <Hotspot key={`${look.id}-${spot.slug}`} spot={spot} resolve={resolve} />)}
        </div>

        {/* In this room panel */}
        <aside className="flex flex-col rounded-3xl border border-neutral-100 bg-white p-4 lg:p-5">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-3 px-1">In this room</p>
          <div className="flex flex-col gap-2">
            {look.spots.map((s) => <RoomProduct key={`${look.id}-row-${s.slug}`} slug={s.slug} resolve={resolve} />)}
          </div>
          <Link
            href="/catalog"
            className="mt-5 inline-flex items-center justify-center gap-1.5 h-11 rounded-full bg-neutral-900 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Shop this room →
          </Link>
        </aside>
      </div>
    </section>
  );
}
