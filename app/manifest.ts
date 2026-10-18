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
    // won't offer to install without an "any" icon of at least 144px. All of
    // them are rendered from favicon.svg: the "any" pair transparent, the
    // maskable pair on white with the whole logo - paddle tips included -
    // inside the central 80% safe zone that launcher masks never crop.
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
