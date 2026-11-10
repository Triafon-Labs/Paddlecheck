import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";
import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
} from "next/constants";

// Which club's settings the app uses: clubs/<CLUB>.yaml, chosen by the CLUB
// environment variable (see "Choosing which file the app uses" in README.md).
//
// - `next build` (a deployment, or `npm run build`) requires CLUB. A site
//   that silently fell back to the example would publish made-up paddling
//   rules, so a missing CLUB fails the build instead – on Vercel the
//   current site stays up.
// - `npm run dev` falls back to clubs/example.yaml and says so in the
//   terminal, so a fresh copy runs with no setup.
//
// Set CLUB in .env.local for your own computer, or in the host's environment
// variables (Vercel: Project Settings → Environment Variables).
const FALLBACK_CLUB = "example";

const clubsDir = path.join(process.cwd(), "clubs");
const availableClubs = () =>
  fs
    .readdirSync(clubsDir)
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => f.replace(/\.yaml$/, ""))
    .join(", ");

const chooseClub = (phase: string): string => {
  const club = (process.env.CLUB ?? "").trim();
  // Only dev and build read the club file. `next start` serves a finished
  // build, whose club was fixed when it was built, so CLUB doesn't matter
  // there and nothing is checked or printed.
  if (phase !== PHASE_DEVELOPMENT_SERVER && phase !== PHASE_PRODUCTION_BUILD) {
    return club || FALLBACK_CLUB;
  }
  if (!club) {
    if (phase === PHASE_PRODUCTION_BUILD) {
      throw new Error(
        `CLUB isn't set, so there's no way to tell which club to build. ` +
          `Set it to the name of your file in clubs/ (one of: ${availableClubs()}) – ` +
          `in .env.local, or in your host's environment variables ` +
          `(Vercel: Project Settings → Environment Variables).`
      );
    }
    // `next dev` loads this file in more than one process; the variable is
    // inherited, so the notice prints once.
    if (!process.env.PADDLECHECK_CLUB_NOTICE) {
      process.env.PADDLECHECK_CLUB_NOTICE = "shown";
      console.warn(
        `\n  CLUB isn't set – using clubs/${FALLBACK_CLUB}.yaml. ` +
          `Set CLUB in .env.local to use your club's file.\n`
      );
    }
    return FALLBACK_CLUB;
  }
  if (
    !/^[\w-]+$/.test(club) ||
    !fs.existsSync(path.join(clubsDir, `${club}.yaml`))
  ) {
    throw new Error(
      `CLUB is "${club}", but there's no clubs/${club}.yaml. ` +
        `Set CLUB to one of: ${availableClubs()}.`
    );
  }
  return club;
};

const nextConfig = (phase: string): NextConfig => {
  const clubFile = `clubs/${chooseClub(phase)}.yaml`;
  return {
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
};

export default nextConfig;
