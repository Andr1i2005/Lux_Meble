import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Run on all paths except API routes, the (non-localized) admin panel,
  // Next internals and files with an extension.
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
