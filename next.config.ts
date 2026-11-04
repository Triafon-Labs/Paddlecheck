import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // club.yaml - the club's settings - is imported like a module.
    rules: {
      "*.yaml": {
        loaders: ["yaml-loader"],
        as: "*.js",
      },
    },
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version,
  },
};

export default nextConfig;
