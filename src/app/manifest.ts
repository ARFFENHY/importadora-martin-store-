import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Importadora Martin Store",
    short_name: "Martin Store",
    description: "Catálogo Digital Importadora Martin Store",
    start_url: "/catalogo",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/icon.jpg",
        sizes: "any",
        type: "image/jpeg",
      },
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
