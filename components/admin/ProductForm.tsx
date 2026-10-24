"use client";

import { useEffect, useRef, useState } from "react";
import { assetUrl } from "@/lib/asset-url";
import type { ProductConfig, ProductCategory, ModelType } from "@/lib/product-catalog";

export interface AssetMatch { path: string; url: string }

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: "sofa", label: "Sofa" },
  { value: "sectional", label: "Sectional" },
  { value: "armchair", label: "Armchair" },
  { value: "ottoman", label: "Ottoman" },
  { value: "bed", label: "Bed" },
  { value: "table", label: "Table" },
  { value: "lighting", label: "Lighting" },
];

const input = "w-full h-10 px-3 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-neutral-900 transition-colors";
const label = "text-xs font-semibold text-neutral-600";

export interface ProductFormValue {
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  category: ProductCategory;
  categoryLabel: string;
  modelType: ModelType;
  modelPath: string;
  startingPrice: number;
  dimensions: { w: number; d: number; h: number };
  accentColor: string;
  photo: string;
  thumbnail: string;
  hasLegs: boolean;
  configurable: boolean;
  availableExtras: string[];
  translations: {
    pl: { subtitle: string; description: string; categoryLabel: string };
    uk: { subtitle: string; description: string; categoryLabel: string };
  };
}

export function emptyProduct(): ProductFormValue {
  return {
    slug: "", name: "", subtitle: "", description: "",
    category: "sofa", categoryLabel: "Sofa", modelType: "procedural", modelPath: "",
    startingPrice: 0, dimensions: { w: 0, d: 0, h: 0 }, accentColor: "#8B7F72",
    photo: "", thumbnail: "", hasLegs: false, configurable: false, availableExtras: [],
    translations: { pl: { subtitle: "", description: "", categoryLabel: "" }, uk: { subtitle: "", description: "", categoryLabel: "" } },
  };
}

export function toFormValue(p: ProductConfig): ProductFormValue {
  return {
    slug: p.slug, name: p.name, subtitle: p.subtitle ?? "", description: p.description ?? "",
    category: p.category, categoryLabel: p.categoryLabel ?? "", modelType: p.modelType,
    modelPath: p.modelPath ?? "", startingPrice: p.startingPrice,
    dimensions: { w: p.dimensions.w, d: p.dimensions.d, h: p.dimensions.h },
    accentColor: p.accentColor, photo: p.photo ?? "", thumbnail: p.thumbnail ?? "",
    hasLegs: p.hasLegs, configurable: p.configurable ?? false,
    availableExtras: p.availableExtras ?? [],
    translations: {
      pl: { subtitle: p.translations?.pl?.subtitle ?? "", description: p.translations?.pl?.description ?? "", categoryLabel: p.translations?.pl?.categoryLabel ?? "" },
      uk: { subtitle: p.translations?.uk?.subtitle ?? "", description: p.translations?.uk?.description ?? "", categoryLabel: p.translations?.uk?.categoryLabel ?? "" },
    },
  };
}

function Field({ label: l, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={label}>{l}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

// Square image preview for a path field. Shows a placeholder when there's no
// path or the image fails to load (e.g. an invalid/incomplete path).
function PreviewBox({ src, accent }: { src: string; accent: string }) {
  const resolved = src ? assetUrl(src) : "";
  // Track the src that failed; when `resolved` changes it no longer matches, so
  // a new/edited path is retried without needing an effect.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(resolved) && failedSrc !== resolved;

  return (
    <div className="w-[120px] h-[120px] rounded-xl border border-neutral-200 overflow-hidden flex items-center justify-center bg-neutral-50 shrink-0"
      style={{ background: `${accent}14` }}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={resolved} alt="" className="w-full h-full object-cover" onError={() => setFailedSrc(resolved ?? null)} />
      ) : (
        <div className="flex flex-col items-center gap-1 text-neutral-300">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="3" y="4.5" width="18" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="8.5" cy="9.5" r="1.6" stroke="currentColor" strokeWidth="1.4" />
            <path d="M4 17l4.5-4.5L13 17M12 15l3-3 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[10px] font-medium">No image</span>
        </div>
      )}
    </div>
  );
}

// Text input with a Storage autocomplete: typing matches existing image objects
// and shows them (with previews) in a dropdown; picking one fills the field.
function AssetInput({
  value,
  onChange,
  placeholder,
  searchAssets,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  searchAssets: (q: string) => Promise<AssetMatch[]>;
}) {
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState<AssetMatch[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(async () => {
      setMatches(await searchAssets(value));
    }, 200);
    return () => clearTimeout(id);
  }, [value, open, searchAssets]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        className={input}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
      />
      {open && matches.length > 0 && (
        <ul className="absolute z-30 left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg p-1">
          {matches.map((m) => (
            <li key={m.path}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange(m.path); setOpen(false); }}
                className={`flex items-center gap-3 w-full text-left px-2 py-1.5 rounded-md hover:bg-neutral-100 transition-colors ${m.path === value ? "bg-neutral-100" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt="" className="w-9 h-9 rounded object-cover shrink-0 bg-neutral-50" />
                <span className="text-xs text-neutral-700 truncate">{m.path}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ProductForm({
  value,
  isNew,
  onChange,
  onSubmit,
  onCancel,
  uploadImage,
  searchAssets,
  saving,
  error,
}: {
  value: ProductFormValue;
  isNew: boolean;
  onChange: (v: ProductFormValue) => void;
  onSubmit: () => void;
  onCancel: () => void;
  uploadImage: (file: File, folder?: string) => Promise<string>;
  searchAssets: (q: string) => Promise<AssetMatch[]>;
  saving: boolean;
  error: string | null;
}) {
  const [uploading, setUploading] = useState<"photo" | "thumbnail" | null>(null);
  const [uploadError, setUploadError] = useState<{ target: "photo" | "thumbnail"; message: string } | null>(null);
  const set = <K extends keyof ProductFormValue>(k: K, v: ProductFormValue[K]) => onChange({ ...value, [k]: v });

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, target: "photo" | "thumbnail") {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(target);
    setUploadError(null);
    try {
      const path = await uploadImage(file, target === "thumbnail" ? "thumbnails" : "products");
      set(target, path);
    } catch (err) {
      setUploadError({ target, message: (err as Error)?.message || "Upload failed" });
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  }

  function uploadButton(target: "photo" | "thumbnail") {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="inline-flex">
          <span className="inline-flex items-center h-9 px-4 rounded-full border border-neutral-300 text-xs font-semibold cursor-pointer hover:border-neutral-900 transition-colors">
            {uploading === target ? "Uploading…" : "Upload image"}
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, target)} disabled={uploading !== null} />
        </label>
        {uploadError?.target === target && (
          <p className="text-xs text-red-600">{uploadError.message}</p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
      className="rounded-2xl border border-neutral-200 bg-white p-6 flex flex-col gap-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{isNew ? "New product" : `Edit — ${value.name || value.slug}`}</h2>
        <div className="flex items-center gap-4">
          {!isNew && value.slug && (
            <a
              href={`/product/${value.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-neutral-300 text-xs font-semibold hover:border-neutral-900 transition-colors"
            >
              View page
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M6 3h7v7M13 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          )}
          <button type="button" onClick={onCancel} className="text-sm text-neutral-500 hover:text-neutral-900">Cancel</button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Slug (URL id)">
          <input className={input} value={value.slug} disabled={!isNew}
            onChange={(e) => set("slug", e.target.value)} placeholder="oslo-armchair" />
        </Field>
        <Field label="Name">
          <input className={input} value={value.name} onChange={(e) => set("name", e.target.value)} placeholder="Oslo Armchair" />
        </Field>
        <Field label="Subtitle">
          <input className={input} value={value.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
        </Field>
        <Field label="Category">
          <select className={input} value={value.category}
            onChange={(e) => {
              const category = e.target.value as ProductCategory;
              const cl = CATEGORIES.find((c) => c.value === category)?.label ?? "";
              onChange({ ...value, category, categoryLabel: cl });
            }}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Category label (shown)">
          <input className={input} value={value.categoryLabel} onChange={(e) => set("categoryLabel", e.target.value)} />
        </Field>
        <Field label="Starting price (€)">
          <input className={input} type="number" min={0} value={value.startingPrice}
            onChange={(e) => set("startingPrice", Number(e.target.value))} />
        </Field>
      </div>

      <Field label="Description">
        <textarea className={`${input} h-auto py-2`} rows={3} value={value.description}
          onChange={(e) => set("description", e.target.value)} />
      </Field>

      {/* Dimensions + accent */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(["w", "d", "h"] as const).map((d) => (
          <Field key={d} label={{ w: "Width (cm)", d: "Depth (cm)", h: "Height (cm)" }[d]}>
            <input className={input} type="number" min={0} value={value.dimensions[d]}
              onChange={(e) => onChange({ ...value, dimensions: { ...value.dimensions, [d]: Number(e.target.value) } })} />
          </Field>
        ))}
        <Field label="Accent color">
          <div className="flex items-center gap-2">
            <input type="color" value={value.accentColor} onChange={(e) => set("accentColor", e.target.value)}
              className="w-10 h-10 rounded-lg border border-neutral-300 cursor-pointer" />
            <input className={input} value={value.accentColor} onChange={(e) => set("accentColor", e.target.value)} />
          </div>
        </Field>
      </div>

      {/* Photo */}
      <div className="grid sm:grid-cols-[120px_1fr] gap-4 items-start">
        <PreviewBox src={value.photo} accent={value.accentColor} />
        <div className="flex flex-col gap-3">
          <Field label="Photo path">
            <AssetInput value={value.photo} onChange={(v) => set("photo", v)} searchAssets={searchAssets} placeholder="/products/oslo-armchair.jpg" />
          </Field>
          {uploadButton("photo")}
        </div>
      </div>

      {/* Thumbnail */}
      <div className="grid sm:grid-cols-[120px_1fr] gap-4 items-start">
        <PreviewBox src={value.thumbnail} accent={value.accentColor} />
        <div className="flex flex-col gap-3">
          <Field label="Thumbnail path (transparent render, optional)">
            <AssetInput value={value.thumbnail} onChange={(v) => set("thumbnail", v)} searchAssets={searchAssets} placeholder="/thumbnails/....png" />
          </Field>
          {uploadButton("thumbnail")}
        </div>
      </div>

      {/* Translations */}
      <div className="grid sm:grid-cols-2 gap-4">
        {(["pl", "uk"] as const).map((loc) => (
          <div key={loc} className="rounded-xl border border-neutral-200 p-4 flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{loc === "pl" ? "Polski" : "Українська"}</p>
            <Field label="Subtitle">
              <input className={input} required value={value.translations[loc].subtitle}
                onChange={(e) => onChange({ ...value, translations: { ...value.translations, [loc]: { ...value.translations[loc], subtitle: e.target.value } } })} />
            </Field>
            <Field label="Category label">
              <input className={input} required value={value.translations[loc].categoryLabel}
                onChange={(e) => onChange({ ...value, translations: { ...value.translations, [loc]: { ...value.translations[loc], categoryLabel: e.target.value } } })} />
            </Field>
            <Field label="Description">
              <textarea className={`${input} h-auto py-2`} rows={2} value={value.translations[loc].description}
                onChange={(e) => onChange({ ...value, translations: { ...value.translations, [loc]: { ...value.translations[loc], description: e.target.value } } })} />
            </Field>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="h-11 px-6 rounded-full bg-neutral-900 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
          {saving ? "Saving…" : isNew ? "Create product" : "Save changes"}
        </button>
        <button type="button" onClick={onCancel} className="h-11 px-6 rounded-full border border-neutral-300 text-sm font-semibold hover:border-neutral-500 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
