// Root layout is a pass-through; <html>/<body> live in app/[locale]/layout.tsx
// so the lang attribute and providers can depend on the active locale.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
