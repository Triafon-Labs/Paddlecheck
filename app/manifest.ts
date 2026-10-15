import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Paddlecheck",
    short_name: "Paddlecheck",
    description: "A kayaking conditions dashboard",
    start_url: "/",
    display: "standalone",
    background_color: "#0A1929",
    theme_color: "#0A1929",
    // A plain ("any") and a maskable icon at each of 192 and 512px. Chrome
    // won't offer to install without an "any" icon of at least 144px; that
    // used to be favicon.svg, which is a 1.25MB PNG wrapped in an SVG rather
    // than a vector. These are the same transparent artwork, resized.
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
