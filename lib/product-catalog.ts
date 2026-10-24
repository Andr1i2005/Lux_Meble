import type { FabricType, FurnitureType, DimensionSize } from "@/types/configurator";
import type { ProductTranslations } from "./product-translations";

export type ModelType = "gltf" | "procedural";
export type ProductCategory = "sectional" | "sofa" | "armchair" | "ottoman" | "bed" | "table" | "lighting";

export interface ProductVariant {
  id: string;
  name: string;
  modelType: ModelType;
  modelPath?: string;
  modelPathWithPillows?: string;
  dimensions: { w: number; d: number; h: number };
  furnitureType?: FurnitureType;
  dimension?: DimensionSize;
  hasLegs?: boolean;
  basePrice?: number;
  thumbnail?: string;
}

export interface ProductConfig {
  slug: string;
  name: string;
  subtitle: string;
  category: ProductCategory;
  categoryLabel: string;
  modelType: ModelType;
  modelPath?: string;
  modelPathWithPillows?: string;
  startingPrice: number;
  dimensions: { w: number; d: number; h: number };
  defaultFabricId?: string;
  availableExtras: string[];
  hasLegs: boolean;
  accentColor: string;
  thumbnail?: string;     // transparent 3D render (shown on a gradient, object-contain)
  photo?: string;         // real photo (shown full-bleed, object-cover)
  description?: string;
  configurable?: boolean; // has a live 3D configurator
  variants?: ProductVariant[];
  translations?: ProductTranslations; // per-locale content overrides (may come from Firebase)
  createdAt?: number;     // ms timestamp; drives "New arrivals" ordering (newest first)
}

/**
 * The primary image to show for a product (card, detail hero, "shop the look").
 * The admin-chosen `thumbnail` wins when set, then `photo`, then a variant render.
 */
export function productImage(p: ProductConfig): string | undefined {
  return p.thumbnail ?? p.photo ?? p.variants?.find((v) => v.thumbnail)?.thumbnail;
}

export const productCatalog: ProductConfig[] = [
  {
    slug: "nordvik-sofa",
    name: "Nordvik Sofa",
    subtitle: "Modular Scandinavian Sofa",
    category: "sofa",
    categoryLabel: "Sofa",
    modelType: "gltf",
    modelPath: "/models/kivik/kivik-3seater.glb",
    startingPrice: 1899,
    dimensions: { w: 181, d: 84, h: 84 },
    availableExtras: ["lumbar-pillow", "throw-blanket"],
    hasLegs: false,
    accentColor: "#5B7C6B",
    thumbnail: "/thumbnails/nordvik-3-seater.png",
    photo: "/products/nordvik-detail.jpg",
    configurable: true,
    description: "A modular Scandinavian sofa available as 2-seater, 3-seater or corner L-shape, with a deep, loungeable seat.",
    variants: [
      {
        id: "2-seater",
        name: "2-Seater",
        modelType: "gltf",
        modelPath: "/models/kivik/kivik-2seater.glb",
        dimensions: { w: 145, d: 95, h: 84 },
        basePrice: 1499,
        thumbnail: "/thumbnails/nordvik-2-seater.png",
      },
      {
        id: "3-seater",
        name: "3-Seater",
        modelType: "gltf",
        modelPath: "/models/kivik/kivik-3seater.glb",
        dimensions: { w: 181, d: 84, h: 84 },
        basePrice: 1899,
        thumbnail: "/thumbnails/nordvik-3-seater.png",
      },
      {
        id: "corner",
        name: "Corner L-Shape",
        modelType: "gltf",
        modelPath: "/models/kivik/kivik-corner.glb",
        dimensions: { w: 259, d: 299, h: 84 },
        basePrice: 2799,
        thumbnail: "/thumbnails/nordvik-corner.png",
      },
    ],
  },
  {
    slug: "classic-sofa",
    name: "Classic 3-Seater",
    subtitle: "Modular Fabric Sofa",
    category: "sofa",
    categoryLabel: "Sofa",
    modelType: "procedural",
    startingPrice: 1799,
    dimensions: { w: 228, d: 95, h: 83 },
    availableExtras: ["lumbar-pillow", "throw-blanket", "tray", "storage"],
    hasLegs: true,
    accentColor: "#4A6741",
    photo: "/products/classic-sofa.jpg",
    description: "A modular fabric sofa with clean lines and tapered legs.",
  },
  {
    slug: "oslo-armchair",
    name: "Oslo Armchair",
    subtitle: "Scandinavian Accent Chair",
    category: "armchair",
    categoryLabel: "Armchair",
    modelType: "procedural",
    startingPrice: 849,
    dimensions: { w: 80, d: 72, h: 83 },
    availableExtras: ["lumbar-pillow", "throw-blanket"],
    hasLegs: true,
    accentColor: "#2D4B6B",
    photo: "/products/oslo-armchair.jpg",
    description: "A Scandinavian accent chair with a sculpted upholstered shell and solid oak legs.",
  },

  // ── Photographed collection (no live 3D — straight add to cart) ──────────
  {
    slug: "rust-loft-sofa",
    name: "Rust Loft Sofa",
    subtitle: "Three-Seat Fabric Sofa",
    category: "sofa",
    categoryLabel: "Sofa",
    modelType: "procedural",
    startingPrice: 1599,
    dimensions: { w: 210, d: 92, h: 84 },
    availableExtras: [],
    hasLegs: true,
    accentColor: "#B25B36",
    photo: "/products/rust-sofa.jpg",
    description: "A warm rust-toned three-seater with plush cushions and slim wooden legs — a statement piece for any room.",
  },
  {
    slug: "brando-leather-sofa",
    name: "Brando Leather Sofa",
    subtitle: "Full-Grain Leather Sofa",
    category: "sofa",
    categoryLabel: "Sofa",
    modelType: "procedural",
    startingPrice: 2299,
    dimensions: { w: 220, d: 95, h: 82 },
    availableExtras: [],
    hasLegs: true,
    accentColor: "#A6713F",
    photo: "/products/brando-leather-sofa.jpg",
    description: "Cognac full-grain leather over a hardwood frame, raised on tapered oak legs. Ages beautifully.",
  },
  {
    slug: "sunny-loveseat",
    name: "Sunny Loveseat",
    subtitle: "Compact Two-Seater",
    category: "sofa",
    categoryLabel: "Sofa",
    modelType: "procedural",
    startingPrice: 1149,
    dimensions: { w: 150, d: 88, h: 80 },
    availableExtras: [],
    hasLegs: true,
    accentColor: "#E0B23C",
    photo: "/products/sunny-loveseat.jpg",
    description: "A cheerful mustard two-seater that fits snug spaces without compromising on comfort.",
  },
  {
    slug: "pod-lounge-chair",
    name: "Pod Lounge Chair",
    subtitle: "Molded Accent Chair",
    category: "armchair",
    categoryLabel: "Armchair",
    modelType: "procedural",
    startingPrice: 699,
    dimensions: { w: 78, d: 80, h: 75 },
    availableExtras: [],
    hasLegs: true,
    accentColor: "#D9D4CC",
    photo: "/products/pod-lounge-chair.jpg",
    description: "A sculptural molded shell on slim legs — a quiet, modern accent for reading corners.",
  },
  {
    slug: "margaux-accent-chair",
    name: "Margaux Accent Chair",
    subtitle: "Tufted Velvet Chair",
    category: "armchair",
    categoryLabel: "Armchair",
    modelType: "procedural",
    startingPrice: 599,
    dimensions: { w: 72, d: 70, h: 82 },
    availableExtras: [],
    hasLegs: true,
    accentColor: "#E7DFD2",
    photo: "/products/margaux-chair.jpg",
    description: "A petite tufted velvet chair with turned legs — equal parts classic and playful.",
  },
  {
    slug: "lumi-bed",
    name: "Lumi Upholstered Bed",
    subtitle: "King Upholstered Bed",
    category: "bed",
    categoryLabel: "Bed",
    modelType: "procedural",
    startingPrice: 1499,
    dimensions: { w: 193, d: 215, h: 120 },
    availableExtras: [],
    hasLegs: false,
    accentColor: "#C9B79C",
    photo: "/products/lumi-bed.jpg",
    description: "A softly upholstered headboard and low platform frame for a calm, hotel-grade bedroom.",
  },
  {
    slug: "birch-console",
    name: "Birch Console",
    subtitle: "Three-Drawer Console",
    category: "table",
    categoryLabel: "Table",
    modelType: "procedural",
    startingPrice: 549,
    dimensions: { w: 120, d: 40, h: 78 },
    availableExtras: [],
    hasLegs: true,
    accentColor: "#B9966A",
    photo: "/products/birch-console.jpg",
    description: "A slim birch console with three drawers and hairpin legs — perfect for entryways and hallways.",
  },
  {
    slug: "arc-floor-lamp",
    name: "Arc Floor Lamp",
    subtitle: "Adjustable Reading Lamp",
    category: "lighting",
    categoryLabel: "Lighting",
    modelType: "procedural",
    startingPrice: 199,
    dimensions: { w: 30, d: 30, h: 150 },
    availableExtras: [],
    hasLegs: false,
    accentColor: "#4A4A4A",
    photo: "/products/arc-floor-lamp.jpg",
    description: "A matte-charcoal floor lamp with an adjustable head — directed light for sofas and reading nooks.",
  },
];

export function getProduct(slug: string): ProductConfig | undefined {
  return productCatalog.find((p) => p.slug === slug);
}

export const categoryLabels: Record<ProductCategory, string> = {
  sectional: "Sectional Sofas",
  sofa: "Sofas",
  armchair: "Armchairs",
  ottoman: "Ottomans",
  bed: "Beds",
  table: "Tables",
  lighting: "Lighting",
};
