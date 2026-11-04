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
    // Whether the AI conditions report is set up. Decided when the app is
    // built, so a site without GROQ_API_KEY leaves the section out entirely
    // rather than showing one that can't work. Only this yes/no is exposed,
    // never the key.
    NEXT_PUBLIC_CONDITIONS_REPORT: process.env.GROQ_API_KEY ? "on" : "off",
  },
};

export default nextConfig;
