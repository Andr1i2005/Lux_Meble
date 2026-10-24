"use client";

import { Link } from "@/i18n/navigation";
import { useAuth } from "./AuthProvider";
import AuthForm from "./AuthForm";

export default function AccountClient() {
  const { user, ready, enabled, signOut } = useAuth();

  if (!enabled) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 px-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Accounts are offline</h1>
        <p className="text-sm text-neutral-500 mt-2">
          Firebase isn’t configured, so sign-in and orders are unavailable. See{" "}
          <code className="text-neutral-700">docs/firebase-setup.md</code> to connect a project.
        </p>
        <Link href="/catalog" className="inline-flex mt-6 px-6 h-11 items-center rounded-full bg-neutral-900 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
          Browse furniture
        </Link>
      </div>
    );
  }

  if (!ready) {
    return <div className="max-w-lg mx-auto py-24 text-center text-sm text-neutral-400">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="py-12 px-6">
        <div className="text-center mb-8">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-2">Account</p>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Sign in to LuxMeble</h1>
          <p className="text-sm text-neutral-500 mt-2">Save your orders and track them across devices.</p>
        </div>
        <AuthForm />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-16 px-6">
      <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-2">Account</p>
      <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Your account</h1>

      <div className="mt-6 rounded-2xl border border-neutral-100 p-5 flex items-center gap-4">
        {user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.photoURL} alt="" className="w-12 h-12 rounded-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="w-12 h-12 rounded-full bg-neutral-900 text-white flex items-center justify-center text-base font-bold uppercase">
            {(user.displayName ?? user.email ?? "?")[0]}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900 truncate">{user.displayName ?? user.email}</p>
          <p className="text-xs text-neutral-400 truncate">{user.displayName ? user.email : "Signed in"}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <Link href="/orders" className="flex-1 h-12 inline-flex items-center justify-center rounded-full bg-neutral-900 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
          Orders &amp; tracking
        </Link>
        <button
          onClick={() => signOut()}
          className="h-12 px-6 inline-flex items-center justify-center rounded-full border border-neutral-200 text-sm font-semibold text-neutral-900 hover:border-neutral-400 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
