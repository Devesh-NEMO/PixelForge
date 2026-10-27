import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PixelForge Image Converter",
    short_name: "PixelForge",
    description:
      "Convert, resize and compress images in your browser. No uploads, ever.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#efeee8",
    theme_color: "#efeee8",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
