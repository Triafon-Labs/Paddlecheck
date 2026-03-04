import type { NextConfig } from "next";
import { GenerateSW } from "workbox-webpack-plugin";

const nextConfig: NextConfig = {
  turbopack: {},
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version,
  },
  turbopack: {},
  webpack: (config, { isServer, dev }) => {
    if (!isServer && !dev) {
      config.plugins.push(
        new GenerateSW({
          swDest: "sw.js",
          runtimeCaching: [
            {
              urlPattern: /^https?.*/,
              handler: "NetworkFirst",
              options: {
                cacheName: "https-calls",
                networkTimeoutSeconds: 15,
                expiration: {
                  maxEntries: 150,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 1 month
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        }),
      );
    }
    return config;
  },
};

export default nextConfig;
