"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useCartStore, cartCount } from "@/store/cart-store";
import { useHydrated } from "@/lib/use-hydrated";
import { useAuth } from "./AuthProvider";
import CartDrawer from "./CartDrawer";
import LanguageSwitcher from "./LanguageSwitcher";

const NAV = [
  { key: "home", href: "/" },
  { key: "shop", href: "/catalog" },
  { key: "about", href: "/about" },
] as const;

export default function SiteHeader() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const hydrated = useHydrated();
  const { items, openCart } = useCartStore();
  const count = hydrated ? cartCount(items) : 0;
  const { enabled: authEnabled, user } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-8 h-16">
          <Link href="/" className="text-base font-bold tracking-tight text-neutral-900">
            LuxMeble
          </Link>

          <nav className="hidden md:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
            {NAV.map((n) => {
              const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`text-sm transition-colors ${active ? "text-neutral-900 font-semibold" : "text-neutral-500 hover:text-neutral-900"}`}
                >
                  {t(n.key)}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-0.5">
          <LanguageSwitcher />
          {authEnabled && (
            <Link
              href="/account"
              className={`flex items-center justify-center w-10 h-10 rounded-full hover:bg-neutral-100 transition-colors ${pathname.startsWith("/account") ? "text-neutral-900" : "text-neutral-700"}`}
              aria-label={hydrated && user ? tc("account") : tc("signIn")}
            >
              {hydrated && user ? (
                user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[11px] font-bold uppercase">
                    {(user.displayName ?? user.email ?? "?")[0]}
                  </span>
                )
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              )}
            </Link>
          )}
          <Link
            href="/orders"
            className={`flex items-center justify-center w-10 h-10 rounded-full hover:bg-neutral-100 transition-colors ${pathname.startsWith("/orders") ? "text-neutral-900" : "text-neutral-700"}`}
            aria-label={tc("ordersTracking")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5v-9z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M3.5 7.5L12 12l8.5-4.5M12 12v9M7.75 5.25l8.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </Link>
          <button
            onClick={openCart}
            className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-neutral-100 transition-colors text-neutral-700"
            aria-label={tc("cart")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 7h13l-1.2 9.2a2 2 0 01-2 1.8H9.2a2 2 0 01-2-1.8L6 4H3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-neutral-900 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {count}
              </span>
            )}
          </button>
          </div>
        </div>
      </header>
      <CartDrawer />
    </>
  );
}
