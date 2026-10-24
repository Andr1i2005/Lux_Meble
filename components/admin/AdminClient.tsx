"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/store/AuthProvider";
import { assetUrl } from "@/lib/asset-url";
import type { ProductConfig } from "@/lib/product-catalog";
import ProductForm, { emptyProduct, toFormValue, type ProductFormValue } from "./ProductForm";

// Build the ProductConfig payload from the form, dropping empty optionals so the
// database stays clean (server also strips undefined).
function toPayload(v: ProductFormValue): Partial<ProductConfig> {
  const clean = (s: string) => (s.trim() ? s.trim() : undefined);
  const tr = (loc: "pl" | "uk") => {
    const t = v.translations[loc];
    const entry = { subtitle: clean(t.subtitle), description: clean(t.description), categoryLabel: clean(t.categoryLabel) };
    return Object.values(entry).some(Boolean) ? entry : undefined;
  };
  const translations = { pl: tr("pl"), uk: tr("uk") };
  const hasTr = translations.pl || translations.uk;

  return {
    slug: v.slug.trim().toLowerCase(),
    name: v.name.trim(),
    subtitle: v.subtitle.trim(),
    description: clean(v.description),
    category: v.category,
    categoryLabel: v.categoryLabel.trim(),
    modelType: v.modelType,
    modelPath: v.modelType === "gltf" ? clean(v.modelPath) : undefined,
    startingPrice: Number(v.startingPrice),
    dimensions: v.dimensions,
    accentColor: v.accentColor,
    photo: clean(v.photo),
    thumbnail: clean(v.thumbnail),
    hasLegs: v.hasLegs,
    configurable: v.configurable,
    availableExtras: v.availableExtras,
    ...(hasTr ? { translations } : {}),
  } as Partial<ProductConfig>;
}

export default function AdminClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, ready, enabled, signInWithGoogle, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  // Whether the admin backend (service account) is configured on this environment.
  // Distinguishes a misconfigured deployment from a genuine non-admin visitor.
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [products, setProducts] = useState<ProductConfig[] | null>(null);
  const [editing, setEditing] = useState<ProductFormValue | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // The URL is the source of truth for which editor is open (?new=1 / ?edit=slug),
  // so refresh, deep links and browser back/forward all work. The editable draft
  // (`editing`) stays in local state. We reconcile the two here, during render
  // (React's "adjust state when inputs change" pattern), applying each URL change
  // exactly once via `appliedParam`.
  const editSlug = searchParams.get("edit");
  const isNewParam = searchParams.get("new") === "1";
  const desired = isNewParam ? "new" : editSlug ?? "";
  const [appliedParam, setAppliedParam] = useState<string | null>(null);
  if (desired !== appliedParam) {
    if (desired === "new") {
      setAppliedParam(desired);
      setEditing(emptyProduct());
      setIsNew(true);
    } else if (desired === "") {
      setAppliedParam(desired);
      setEditing(null);
    } else if (products) {
      // Edit target needs the product list; wait until it's loaded, then apply.
      setAppliedParam(desired);
      const p = products.find((x) => x.slug === desired);
      setEditing(p ? toFormValue(p) : null);
      setIsNew(false);
    }
  }

  const authedFetch = useCallback(async (path: string, init?: RequestInit) => {
    const token = await user!.getIdToken();
    return fetch(path, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` } });
  }, [user]);

  // Resolve admin status + load products once signed in. When signed out the
  // gates below short-circuit before the dashboard, so no reset is needed here.
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const res = await authedFetch("/api/admin/session");
      const data = await res.json().catch(() => ({}));
      if (!active) return;
      setConfigured(data.configured !== false);
      setIsAdmin(Boolean(data.admin));
      if (data.admin) {
        const pr = await authedFetch("/api/admin/products");
        const pd = await pr.json().catch(() => ({}));
        if (active) setProducts(pd.products ?? []);
      }
    })();
    return () => { active = false; };
  }, [user, authedFetch]);

  // A signed-in, non-whitelisted user has no business here — bounce them home.
  // (The API routes are independently protected; this is UX + not revealing /admin.)
  // Only redirect when the backend IS configured and the user simply isn't an
  // admin — a misconfigured environment shows an explicit message instead.
  useEffect(() => {
    if (isAdmin === false && configured === true) router.replace("/");
  }, [isAdmin, configured, router]);

  async function reload() {
    const pr = await authedFetch("/api/admin/products");
    const pd = await pr.json().catch(() => ({}));
    setProducts(pd.products ?? []);
  }

  const uploadImage = useCallback(async (file: File, folder?: string): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    if (folder) fd.append("folder", folder);
    const res = await authedFetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    // Throw with the message so the form can show it inline next to the button.
    if (!res.ok) throw new Error(data.error ?? "Upload failed");
    return data.path as string;
  }, [authedFetch]);

  const searchAssets = useCallback(async (q: string): Promise<{ path: string; url: string }[]> => {
    const res = await authedFetch(`/api/admin/storage?q=${encodeURIComponent(q)}`);
    const data = await res.json().catch(() => ({}));
    return res.ok ? data.matches ?? [] : [];
  }, [authedFetch]);

  async function save() {
    if (!editing) return;
    setSaving(true); setError(null);
    try {
      const res = await authedFetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(editing)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Save failed"); return; }
      await reload();
      closeEditor();
    } finally {
      setSaving(false);
    }
  }

  // Navigate the editor state through the URL so it stays in sync.
  const openNew = () => { setError(null); router.push(`${pathname}?new=1`); };
  const openEdit = (slug: string) => { setError(null); router.push(`${pathname}?edit=${slug}`); };
  const closeEditor = () => { setError(null); router.push(pathname); };

  async function remove(slug: string) {
    if (!confirm(`Delete "${slug}"? This cannot be undone.`)) return;
    const res = await authedFetch(`/api/admin/products/${slug}`, { method: "DELETE" });
    if (res.ok) await reload();
    else { const d = await res.json().catch(() => ({})); alert(d.error ?? "Delete failed"); }
  }

  // ── Gates ──────────────────────────────────────────────────────────────────
  if (!enabled) {
    return <Shell><Notice title="Admin is offline" text="Firebase isn’t configured. See docs/firebase-setup.md." /></Shell>;
  }
  if (!ready) {
    return <Shell><p className="text-sm text-neutral-400">Loading…</p></Shell>;
  }
  if (!user) {
    return (
      <Shell>
        <Notice title="Sign in to continue" text="Admin access requires a signed-in, authorized account." />
        <button
          onClick={() => signInWithGoogle().catch((e) => setAuthError((e as { code?: string })?.code ?? "Sign-in failed"))}
          className="mt-5 h-11 px-6 rounded-full bg-neutral-900 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Continue with Google
        </button>
        {authError && <p className="text-xs text-red-600 mt-3">{authError}</p>}
      </Shell>
    );
  }
  if (isAdmin === null) {
    return <Shell><p className="text-sm text-neutral-400">Checking access…</p></Shell>;
  }
  if (configured === false) {
    // Backend (service account) not set up on this environment — e.g. missing
    // env vars on the production host. Not a "wrong account" situation.
    return (
      <Shell>
        <Notice title="Admin backend not configured" text="The Firebase service account and ADMIN_EMAILS aren’t set on this environment. Add them to your hosting env vars and redeploy." />
        <button onClick={() => signOut()} className="mt-5 h-10 px-5 rounded-full border border-neutral-300 text-sm font-semibold hover:border-neutral-500 transition-colors">
          Sign out
        </button>
      </Shell>
    );
  }
  if (!isAdmin) {
    // Configured backend + non-admin account → redirect is in-flight (effect above).
    return <Shell><p className="text-sm text-neutral-400">Redirecting…</p></Shell>;
  }

  // ── Admin dashboard ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold">LuxMeble</span>
            <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500 hidden sm:block">{user.email}</span>
            <button onClick={() => signOut()} className="text-xs font-semibold text-neutral-600 hover:text-neutral-900">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {editing ? (
          <ProductForm
            value={editing}
            isNew={isNew}
            onChange={setEditing}
            onSubmit={save}
            onCancel={closeEditor}
            uploadImage={uploadImage}
            searchAssets={searchAssets}
            saving={saving}
            error={error}
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Products</h1>
                <p className="text-sm text-neutral-500 mt-0.5">{products?.length ?? 0} in the catalog</p>
              </div>
              <button
                onClick={openNew}
                className="h-10 px-5 rounded-full bg-neutral-900 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                + New product
              </button>
            </div>

            {products === null ? (
              <p className="text-sm text-neutral-400 py-10">Loading products…</p>
            ) : products.length === 0 ? (
              <p className="text-sm text-neutral-400 py-10">No products yet. Create your first one.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {products.map((p) => (
                  <div key={p.slug} className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-3">
                    <div className="w-14 h-14 rounded-lg shrink-0 overflow-hidden flex items-center justify-center" style={{ background: `${p.accentColor}14` }}>
                      {(p.photo || p.thumbnail)
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={assetUrl(p.photo || p.thumbnail)} alt="" className="w-full h-full object-cover" />
                        : <span className="w-6 h-3 rounded" style={{ background: p.accentColor }} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{p.name}</p>
                      <p className="text-xs text-neutral-500 truncate">{p.categoryLabel} · {p.startingPrice} € · {p.slug}</p>
                    </div>
                    {p.configurable && <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5 shrink-0">3D</span>}
                    <a href={`/product/${p.slug}`} target="_blank" rel="noreferrer"
                      className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 px-2">View</a>
                    <button onClick={() => openEdit(p.slug)}
                      className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 px-2">Edit</button>
                    <button onClick={() => remove(p.slug)}
                      className="text-xs font-semibold text-red-600 hover:text-red-800 px-2">Delete</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">{children}</div>
    </div>
  );
}

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <>
      <h1 className="text-xl font-bold tracking-tight">{title}</h1>
      <p className="text-sm text-neutral-500 mt-2">{text}</p>
    </>
  );
}
