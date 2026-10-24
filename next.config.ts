import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // firebase-admin (via jwks-rsa → jose) breaks when bundled by Turbopack on the
  // server — require() of an ESM module throws ERR_REQUIRE_ESM at runtime. Keep
  // it external so it's loaded from node_modules as-is instead of bundled.
  serverExternalPackages: ["firebase-admin"],
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
