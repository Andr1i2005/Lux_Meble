"use client";

import { useEffect, useState } from "react";

/** True only after the component has mounted on the client. Use to gate
 *  rendering of persisted (localStorage) state and avoid hydration mismatches. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
