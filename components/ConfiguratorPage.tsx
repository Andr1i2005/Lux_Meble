"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { useRouter } from "@/i18n/navigation";
import { useCurrencyStore, convert, CURRENCY_META, type Currency } from "@/store/currency-store";
import { useHydrated } from "@/lib/use-hydrated";
import FurniturePreview from "./preview/FurniturePreview";
import ModuleThumbnail from "./configurator/ModuleThumbnail";
import { useConfiguratorStore } from "@/store/configurator-store";
import { useCartStore } from "@/store/cart-store";
import { fabricOptions, legOptions, sofaModules, calculateTotalPrice } from "@/lib/furniture-data";
import { assetUrl } from "@/lib/asset-url";
import type { FabricOption, LegOption, SofaModule } from "@/types/configurator";
import type { ProductConfig, ProductVariant } from "@/lib/product-catalog";
import CartDrawer from "./store/CartDrawer";

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconBack = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconRuler = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="4" width="14" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    <line x1="4" y1="4" x2="4" y2="7"  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="7" y1="4" x2="7" y2="6"  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="10" y1="4" x2="10" y2="7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="13" y1="4" x2="13" y2="6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconCart = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 7h13l-1.2 9.2a2 2 0 01-2 1.8H9.2a2 2 0 01-2-1.8L6 4H3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconHeart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M12 20s-7-4.5-9.2-8.6C1.2 8.3 2.6 5 5.8 5c1.9 0 3.2 1.1 4.2 2.4C11 6.1 12.3 5 14.2 5c3.2 0 4.6 3.3 3 6.4C19 15.5 12 20 12 20z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);
const IconStar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.8 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2z" />
  </svg>
);

const RATING = { score: 4.9, count: 248 };

// ─── Variant picker ───────────────────────────────────────────────────────────

// Top-down plan-view thumbnail of a sofa variant. Uses `currentColor` so it
// inverts automatically on the active (dark) button. Shape is inferred from the
// variant id (…2… / …3… / corner), defaulting to a 3-seat straight sofa.
function VariantThumbnail({ variantId }: { variantId: string }) {
  const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
  };

  if (variantId.toLowerCase().includes("corner")) {
    return (
      <svg viewBox="0 0 38 38" className="w-9 h-9" {...stroke}>
        {/* backrest: top + left (outer edges of the L) */}
        <rect x="4" y="4" width="30" height="5" rx="2" />
        <rect x="4" y="4" width="5" height="30" rx="2" />
        {/* arms: right end of top run, bottom end of side run */}
        <rect x="29" y="9" width="5" height="13" rx="1.6" />
        <rect x="9" y="29" width="13" height="5" rx="1.6" />
        {/* seat cushions, L arrangement */}
        <rect x="10.5" y="10.5" width="9" height="9" rx="1.4" />
        <rect x="20.5" y="10.5" width="8" height="9" rx="1.4" />
        <rect x="10.5" y="20.5" width="9" height="8" rx="1.4" />
      </svg>
    );
  }

  const seats = variantId.includes("2") ? 2 : 3;
  const x0 = 8, x1 = 32, span = x1 - x0, gap = 1.6;
  const cw = (span - gap * (seats - 1)) / seats;

  return (
    <svg viewBox="0 0 40 28" className="w-9 h-9" {...stroke}>
      {/* backrest */}
      <rect x="3" y="3" width="34" height="5" rx="2" />
      {/* arms */}
      <rect x="3" y="3" width="5" height="21" rx="2" />
      <rect x="32" y="3" width="5" height="21" rx="2" />
      {/* seat cushions */}
      {Array.from({ length: seats }, (_, i) => (
        <rect key={i} x={x0 + i * (cw + gap)} y="10" width={cw} height="13" rx="1.4" />
      ))}
    </svg>
  );
}

function VariantRow({
  variants,
  selectedId,
  onChange,
}: {
  variants: ProductVariant[];
  selectedId: string;
  onChange: (id: string) => void;
}) {
  const t = useTranslations("configurator");
  return (
    <div className="px-5 pt-5 pb-4 border-b border-neutral-100">
      <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-3">{t("configuration")}</p>
      <div className="flex gap-2">
        {variants.map((v) => {
          const active = v.id === selectedId;
          return (
            <motion.button
              key={v.id}
              onClick={() => onChange(v.id)}
              whileTap={{ scale: 0.96 }}
              className="flex-1 flex flex-col items-center gap-1.5 pt-2 pb-2.5 px-2 rounded-xl border-2 transition-all text-neutral-700"
              style={{
                borderColor: active ? "#111111" : "#ececec",
                background:  active ? "#fafafa" : "#fff",
              }}
              aria-pressed={active}
            >
              <span className="flex items-center justify-center w-full aspect-square rounded-lg bg-gradient-to-b from-neutral-50 to-neutral-100">
                {v.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={assetUrl(v.thumbnail)}
                    alt={v.name}
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                ) : (
                  <VariantThumbnail variantId={v.id} />
                )}
              </span>
              <span className="text-[11px] font-semibold leading-tight text-center">{v.name}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Frame / base colour presets (leather / eco-leather tones) ────────────────

const FRAME_COLOURS = [
  { hex: "#1A1A1A", label: "Anthracite",  tk: "anthracite" },
  { hex: "#2C2C2C", label: "Graphite",    tk: "graphite"   },
  { hex: "#3D2B1F", label: "Dark Walnut", tk: "darkWalnut" },
  { hex: "#5C3D1E", label: "Cognac",      tk: "cognac"     },
  { hex: "#7A6652", label: "Taupe",       tk: "taupe"      },
  { hex: "#F5F0E8", label: "Ivory",       tk: "ivory"      },
];

function FrameRow() {
  const t = useTranslations("configurator");
  const { frameColor, setFrameColor } = useConfiguratorStore();
  const activeFrame = FRAME_COLOURS.find((c) => c.hex === frameColor);

  return (
    <div className="px-5 pt-5 pb-4 border-b border-neutral-100">
      <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-1">{t("frameBase")}</p>
      <p className="text-sm font-medium text-neutral-800 mt-0.5">
        {activeFrame ? t(`frameColors.${activeFrame.tk}`) : t("custom")}
      </p>
      <div className="flex items-center gap-2 mt-3">
        {FRAME_COLOURS.map((c) => (
          <motion.button
            key={c.hex}
            onClick={() => setFrameColor(c.hex)}
            whileTap={{ scale: 0.88 }}
            title={c.label}
            className="rounded-full transition-transform hover:scale-110 focus:outline-none flex-shrink-0"
            style={{
              width: 34, height: 34,
              background: c.hex,
              boxShadow:
                c.hex === frameColor
                  ? "0 0 0 2px #ffffff, 0 0 0 4px #111111"
                  : "0 0 0 1px rgba(0,0,0,0.15)",
            }}
            aria-label={c.label}
            aria-pressed={c.hex === frameColor}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Cover selector ───────────────────────────────────────────────────────────

const VISIBLE_SWATCHES = 6;

function CoverRow({ fabrics = fabricOptions }: { fabrics?: FabricOption[] }) {
  const t = useTranslations("configurator");
  const { selectedFabric, setFabric } = useConfiguratorStore();
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? fabrics : fabrics.slice(0, VISIBLE_SWATCHES);

  return (
    <div className="px-5 pt-5 pb-4 border-b border-neutral-100">
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400">{t("cover")}</p>
          <p className="text-sm font-medium text-neutral-800 mt-0.5">{selectedFabric.color}</p>
        </div>
        <button className="text-neutral-400 hover:text-neutral-700 transition-colors mt-0.5">
          <IconChevronRight />
        </button>
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {visible.map((f) => (
          <motion.button
            key={f.id}
            onClick={() => setFabric(f)}
            whileTap={{ scale: 0.88 }}
            title={f.color}
            className="relative rounded-full transition-transform hover:scale-110 focus:outline-none"
            style={{
              width: 34, height: 34,
              background: f.hex,
              boxShadow: f.id === selectedFabric.id
                ? `0 0 0 2px #ffffff, 0 0 0 4px #111111`
                : "0 0 0 1px rgba(0,0,0,0.1)",
            }}
            aria-label={f.color}
            aria-pressed={f.id === selectedFabric.id}
          />
        ))}
        {!showAll && fabrics.length > VISIBLE_SWATCHES && (
          <button
            onClick={() => setShowAll(true)}
            className="w-[34px] h-[34px] rounded-full bg-neutral-100 text-neutral-600 text-[11px] font-semibold hover:bg-neutral-200 transition-colors flex items-center justify-center"
          >
            +{fabrics.length - VISIBLE_SWATCHES}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Module grid ──────────────────────────────────────────────────────────────

function ModuleGrid({ modules = sofaModules }: { modules?: SofaModule[] }) {
  const { selectedModule, setModule, selectedFabric } = useConfiguratorStore();

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="grid grid-cols-2 gap-3">
        {modules.map((m) => (
          <ModuleThumbnail
            key={m.id}
            module={m}
            fabricHex={selectedFabric.hex}
            isSelected={m.id === selectedModule.id}
            onClick={() => setModule(m)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Leg selector ─────────────────────────────────────────────────────────────

function LegSelector({ legs = legOptions }: { legs?: LegOption[] }) {
  const t = useTranslations("configurator");
  const { selectedLeg, setLeg } = useConfiguratorStore();
  const LEG_COLORS: Record<string, string> = {
    walnut: "#5C3D1E", oak: "#C8A96E", "matte-black": "#1A1A1A", brass: "#B8960C",
  };

  return (
    <div className="px-5 py-4 border-t border-neutral-100">
      <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-3">{t("legs")}</p>
      <div className="flex gap-2 flex-wrap">
        {legs.map((leg) => (
          <motion.button
            key={leg.id}
            onClick={() => setLeg(leg)}
            whileTap={{ scale: 0.95 }}
            title={leg.name}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
            style={{
              borderColor: leg.id === selectedLeg.id ? "#111111" : "#e5e7eb",
              background:  leg.id === selectedLeg.id ? "#111111" : "#fff",
              color:       leg.id === selectedLeg.id ? "#fff"    : "#374151",
            }}
          >
            <span className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ background: LEG_COLORS[leg.material] }} />
            {leg.name}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Dimensions badge ─────────────────────────────────────────────────────────

function DimensionsBadge({ dims }: { dims: { w: number; d: number; h: number } }) {
  const t = useTranslations("configurator");
  return (
    <div className="px-5 py-3 border-t border-neutral-100">
      <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-2">{t("dimensions")}</p>
      <div className="flex gap-3">
        {[
          { label: "W", value: dims.w },
          { label: "D", value: dims.d },
          { label: "H", value: dims.h },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-baseline gap-1">
            <span className="text-[10px] text-neutral-400">{label}</span>
            <span className="text-xs font-semibold text-neutral-700">{value}</span>
            <span className="text-[10px] text-neutral-400">cm</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Rating row ───────────────────────────────────────────────────────────────

function RatingRow() {
  return (
    <div className="flex items-center gap-1.5 mt-2">
      <span className="flex items-center gap-0.5 text-amber-500">
        {Array.from({ length: 5 }, (_, i) => <IconStar key={i} />)}
      </span>
      <span className="text-xs font-semibold text-neutral-900">{RATING.score}</span>
      <span className="text-xs text-neutral-400">({RATING.count} reviews)</span>
    </div>
  );
}

// ─── Sticky price footer ──────────────────────────────────────────────────────

const TRUST_KEYS = ["delivery", "returns", "warranty"] as const;

function PriceFooter({ total, onAdd }: { total: number; onAdd: () => void }) {
  const t = useTranslations("configurator");
  const hydrated = useHydrated();
  const storeCurrency = useCurrencyStore((s) => s.currency);
  const currency: Currency = hydrated ? storeCurrency : "EUR";
  return (
    <div className="shrink-0 border-t border-neutral-100 bg-white/95 backdrop-blur px-5 pt-4 pb-5">
      <div className="flex items-end justify-between mb-3.5">
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400">{t("yourConfiguration")}</p>
          <span className="flex items-baseline gap-1 mt-1">
            <span className="text-[26px] leading-none font-bold text-neutral-900 tracking-tight tabular-nums">
              <NumberFlow value={convert(total, currency)} locales="uk-UA" />
            </span>
            <span className="text-sm font-medium text-neutral-400">{CURRENCY_META[currency].symbol}</span>
          </span>
          <p className="text-[11px] text-neutral-400 mt-1.5">{t("vatNote")}</p>
        </div>
      </div>
      <button
        onClick={onAdd}
        className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 text-white text-sm font-semibold hover:opacity-90 active:scale-[0.99] transition-all shadow-sm"
      >
        <IconCart /> {t("addToCart")}
      </button>
      <div className="flex items-center justify-center gap-x-4 gap-y-1 flex-wrap mt-3">
        {TRUST_KEYS.map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5 text-[11px] text-neutral-400">
            <span className="w-1 h-1 rounded-full bg-emerald-500" /> {t(`trust.${k}`)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface ConfiguratorPageProps {
  product: ProductConfig;
  // Configurator options come from Firebase (server-fetched); default to static.
  fabrics?: FabricOption[];
  legs?: LegOption[];
  modules?: SofaModule[];
}

export default function ConfiguratorPage({
  product,
  fabrics = fabricOptions,
  legs = legOptions,
  modules = sofaModules,
}: ConfiguratorPageProps) {
  const t = useTranslations("configurator");
  const mounted = useHydrated();
  const storeCurrency = useCurrencyStore((s) => s.currency);
  const currency: Currency = mounted ? storeCurrency : "EUR";
  const router = useRouter();
  const {
    selectedModule, selectedFabric, selectedLeg, showDimensions,
    frameColor, selectedVariantId, setVariant, toggleDimensions,
  } = useConfiguratorStore();

  const [sheetOpen, setSheetOpen] = useState(false);

  // Resolve the active variant, falling back to the first one if the stored id
  // doesn't belong to this product (state persists across products via the URL).
  const activeVariant = product.variants
    ? (product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0])
    : null;

  const effectiveModelType          = activeVariant?.modelType          ?? product.modelType;
  const effectiveModelPath          = activeVariant?.modelPath          ?? (activeVariant ? undefined : product.modelPath);
  const effectiveModelPathWithPills = activeVariant?.modelPathWithPillows ?? (activeVariant ? undefined : product.modelPathWithPillows);
  const effectiveDims               = activeVariant?.dimensions         ?? product.dimensions;
  const effectiveHasLegs            = activeVariant?.hasLegs            ?? product.hasLegs;
  const isKivikModel                = !!effectiveModelPath?.includes("/kivik/");
  const showsFrame                  = effectiveModelType === "gltf" && !isKivikModel;

  // ── Persist the configuration in the URL query (shareable links) ──────────
  const hydrated = useRef(false);
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const patch: Record<string, unknown> = {};

    const fabric = fabrics.find((f) => f.id === sp.get("fabric"));
    if (fabric) patch.selectedFabric = fabric;

    const leg = legs.find((l) => l.id === sp.get("legs"));
    if (leg) patch.selectedLeg = leg;

    const dims = sp.get("dims");
    if (dims !== null) patch.showDimensions = dims === "1";

    const frame = sp.get("frame");
    if (frame) patch.frameColor = `#${frame.replace(/^#/, "")}`;

    const variant = sp.get("variant");
    if (product.variants?.some((v) => v.id === variant)) patch.selectedVariantId = variant;
    else if (product.variants) patch.selectedVariantId = product.variants[0].id;

    if (Object.keys(patch).length) useConfiguratorStore.setState(patch);
    hydrated.current = true;
    // Runs once on mount; fabrics/legs are stable server-passed props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  useEffect(() => {
    if (!hydrated.current) return;
    const params = new URLSearchParams();
    if (activeVariant) params.set("variant", activeVariant.id);
    params.set("fabric", selectedFabric.id);
    if (effectiveHasLegs) params.set("legs", selectedLeg.id);
    params.set("dims", showDimensions ? "1" : "0");
    if (showsFrame) params.set("frame", frameColor.replace(/^#/, ""));
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [
    activeVariant, selectedFabric, selectedLeg,
    showDimensions, frameColor, effectiveHasLegs, showsFrame,
  ]);

  // Base price comes from the active variant when present (size drives price),
  // otherwise from the selected procedural module.
  const basePrice = activeVariant?.basePrice ?? selectedModule.basePrice;
  const total = calculateTotalPrice(
    basePrice,
    selectedFabric,
    effectiveHasLegs ? selectedLeg : null,
    [],
  );

  const { addItem, openCart } = useCartStore();

  function handleAddToCart() {
    const frameLabel = showsFrame ? FRAME_COLOURS.find((c) => c.hex === frameColor)?.label : null;
    const configLabel = [
      activeVariant?.name,
      selectedFabric.color,
      frameLabel && `${frameLabel} frame`,
      effectiveHasLegs && selectedLeg.name,
    ].filter(Boolean).join(" · ");

    const id = [
      product.slug,
      activeVariant?.id ?? "base",
      selectedFabric.id,
      showsFrame ? frameColor : "",
      effectiveHasLegs ? selectedLeg.id : "",
    ].join("__");

    addItem({
      id,
      slug: product.slug,
      name: product.name,
      configLabel,
      configQuery: typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : "",
      unitPrice: total,
      thumbnail: activeVariant?.thumbnail ?? product.thumbnail ?? product.photo,
      accentColor: product.accentColor,
    });
    openCart();
  }

  const sidebarContent = (
    <>
      {product.variants && (
        <VariantRow
          variants={product.variants}
          selectedId={activeVariant?.id ?? ""}
          onChange={setVariant}
        />
      )}
      <CoverRow fabrics={fabrics} />
      {effectiveModelType === "gltf" && !isKivikModel && <FrameRow />}
      {effectiveModelType === "procedural" && !product.variants && <ModuleGrid modules={modules} />}
      {effectiveHasLegs && <LegSelector legs={legs} />}
      <DimensionsBadge dims={effectiveModelType === "procedural" && !activeVariant ? selectedModule.dimensions : effectiveDims} />
      <div className="h-6" />
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-white" style={{ fontFamily: "inherit" }}>

      {/* ── Preview ── */}
      <div className="flex-1 relative overflow-hidden">
        <FurniturePreview
          modelPath={effectiveModelPath}
          modelPathWithPillows={effectiveModelPathWithPills}
          overrideFurnitureType={activeVariant?.furnitureType}
          overrideDimension={activeVariant?.dimension}
          overrideDims={effectiveDims}
          variantId={activeVariant?.id ?? undefined}
        />

        {/* Top bar — back + product name + save */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-5 left-5 z-20 inline-flex items-center gap-1.5 h-9 pl-2.5 pr-4 rounded-full bg-white/90 backdrop-blur-sm shadow-sm text-neutral-700 hover:bg-white text-sm font-medium transition-all"
          aria-label={t("backToCatalog")}
        >
          <IconBack /> Back
        </button>

        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 hidden sm:flex items-center gap-2 h-9 px-4 rounded-full bg-white/85 backdrop-blur-sm shadow-sm">
          <span className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400">{product.categoryLabel}</span>
          <span className="w-px h-3.5 bg-neutral-200" />
          <span className="text-sm font-semibold text-neutral-900">{product.name}</span>
        </div>

        <button
          className="absolute top-5 right-5 z-20 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-neutral-700 hover:bg-white transition-all"
          aria-label={t("saveToFavourites")}
        >
          <IconHeart />
        </button>

        {/* Dimension toggle */}
        <div className="absolute bottom-24 md:bottom-5 left-5 z-20">
          <button
            onClick={toggleDimensions}
            className="flex items-center gap-2 h-8 px-4 rounded-full text-xs font-medium transition-all shadow-sm"
            style={{
              background: showDimensions ? "#111111" : "rgba(255,255,255,0.9)",
              color: showDimensions ? "#ffffff" : "#374151",
              backdropFilter: "blur(6px)",
            }}
          >
            <IconRuler />
            {showDimensions ? t("hideDimensions") : t("showDimensions")}
          </button>
        </div>

        {/* Mobile action bar */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 z-30 flex items-center gap-3 border-t border-neutral-100 bg-white/95 backdrop-blur px-4 py-3">
          <div className="shrink-0">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-neutral-400 leading-none">{t("total")}</p>
            <span className="flex items-baseline gap-0.5 mt-1">
              <span className="text-lg font-bold text-neutral-900 tracking-tight tabular-nums leading-none">
                <NumberFlow value={convert(total, currency)} locales="uk-UA" />
              </span>
              <span className="text-xs font-medium text-neutral-400">{CURRENCY_META[currency].symbol}</span>
            </span>
          </div>
          <button
            onClick={() => setSheetOpen(true)}
            className="flex-1 h-11 rounded-full border border-neutral-200 text-sm font-semibold text-neutral-900 hover:border-neutral-400 transition-colors"
          >
            {t("customise")}
          </button>
          <button
            onClick={handleAddToCart}
            className="h-11 px-5 inline-flex items-center gap-1.5 rounded-full bg-neutral-900 text-white text-sm font-semibold shadow-sm active:scale-[0.99] transition-transform"
          >
            <IconCart /> {t("add")}
          </button>
        </div>
      </div>

      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex flex-col w-[384px] shrink-0 bg-white overflow-hidden"
        style={{ borderLeft: "1px solid #e5e7eb" }}
      >
        <div className="px-5 pt-5 pb-4 border-b border-neutral-100 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400">
                {product.categoryLabel}
              </p>
              <h1 className="text-xl font-bold text-neutral-900 tracking-tight mt-1">{product.name}</h1>
              <p className="text-sm text-neutral-500 mt-0.5">{product.subtitle}</p>
            </div>
            <button
              className="shrink-0 w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:border-neutral-400 transition-colors"
              aria-label={t("saveToFavourites")}
            >
              <IconHeart />
            </button>
          </div>
          <RatingRow />
        </div>
        <div className="flex-1 overflow-y-auto">{sidebarContent}</div>
        <PriceFooter total={total} onAdd={handleAddToCart} />
      </aside>

      {/* ── Mobile sheet ── */}
      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            className="md:hidden fixed inset-0 z-40 bg-white flex flex-col"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
          >
            <div className="px-5 pt-5 pb-4 border-b border-neutral-100 flex items-start justify-between shrink-0">
              <div>
                <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400">{product.categoryLabel}</p>
                <p className="text-lg font-bold text-neutral-900 tracking-tight mt-0.5">{product.name}</p>
              </div>
              <button
                onClick={() => setSheetOpen(false)}
                className="shrink-0 w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
                aria-label={t("close")}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{sidebarContent}</div>
            <PriceFooter total={total} onAdd={() => { handleAddToCart(); setSheetOpen(false); }} />
          </motion.div>
        )}
      </AnimatePresence>

      <CartDrawer />
    </div>
  );
}
