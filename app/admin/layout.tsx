import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "../globals.css";
import AuthProvider from "@/components/store/AuthProvider";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Admin — LuxMeble",
  robots: { index: false, follow: false },
};

// The admin panel lives outside the [locale] segment (English-only, not indexed),
// so it renders its own <html>/<body> and only needs the auth provider.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="h-full antialiased bg-neutral-50 text-neutral-900" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
