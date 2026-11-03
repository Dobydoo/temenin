import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Temenin",
    short_name: "Temenin",
    description: "Find a verified activity buddy for the plan you already have.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF6DC",
    theme_color: "#425B9A",
    icons: [
      { src: "/brand/icon-96.png", sizes: "96x96", type: "image/png" },
      { src: "/brand/icon-256.png", sizes: "256x256", type: "image/png" },
      { src: "/brand/icon-1024.png", sizes: "1024x1024", type: "image/png" },
    ],
  };
}
