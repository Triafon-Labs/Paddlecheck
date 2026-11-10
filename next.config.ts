import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

// Which club's settings to build with: clubs/<CLUB>.yaml. Without CLUB the
// app builds with clubs/example.yaml, a starting point for a new club. Set it
// in .env.local for `npm run dev`, or in the host's environment variables
// (Vercel: Project Settings → Environment Variables) for a deployment.
const clubsDir = path.join(process.cwd(), "clubs");
const club = (process.env.CLUB ?? "").trim() || "example";
const clubFile = `clubs/${club}.yaml`;
if (
  !/^[\w-]+$/.test(club) ||
  !fs.existsSync(path.join(clubsDir, `${club}.yaml`))
) {
  const available = fs
    .readdirSync(clubsDir)
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => f.replace(/\.yaml$/, ""));
  throw new Error(
    `CLUB is "${club}", but there's no ${clubFile}. ` +
      `Set CLUB to one of: ${available.join(", ")}.`
  );
}

const nextConfig: NextConfig = {
  turbopack: {
    // The chosen club's settings are imported like a module, as
    // "@club-config" (lib/clubConfig.ts).
    resolveAlias: {
      "@club-config": `./${clubFile}`,
    },
    rules: {
      "*.yaml": {
        loaders: ["yaml-loader"],
        as: "*.js",
      },
    },
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version,
    // The settings file in use, so a problem in it is reported by its name.
    NEXT_PUBLIC_CLUB_FILE: clubFile,
    // Whether the AI conditions report is set up. Decided when the app is
    // built, so a site without GROQ_API_KEY leaves the section out entirely
    // rather than showing one that can't work. Only this yes/no is exposed,
    // never the key.
    NEXT_PUBLIC_CONDITIONS_REPORT: process.env.GROQ_API_KEY ? "on" : "off",
  },
};

export default nextConfig;
