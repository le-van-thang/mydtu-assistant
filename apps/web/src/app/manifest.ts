// file: apps/web/src/app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MYDTU Assistant",
    short_name: "MYDTU",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0f19",
    theme_color: "#0b0f19",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
