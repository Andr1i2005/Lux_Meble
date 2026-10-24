import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware navigation. Use these instead of next/link + next/navigation so
// links and pushes keep the active locale prefix.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
