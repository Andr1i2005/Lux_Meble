import { Suspense } from "react";
import AdminClient from "@/components/admin/AdminClient";

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-neutral-400">Loading…</div>}>
      <AdminClient />
    </Suspense>
  );
}
