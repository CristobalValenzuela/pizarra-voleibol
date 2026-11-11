import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.png"], // Asegúrate de tener tu logo en la carpeta public o assets
      manifest: {
        name: "Ragnarok Voley - Pizarra Táctica",
        short_name: "Ragnarok",
        description:
          "Pizarra táctica digital y registro de estadísticas para vóleibol",
        theme_color: "#773035",
        background_color: "#020617",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
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
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "/screenshot-mobile.png",
            sizes: "309x814",
            type: "image/png",
            form_factor: "narrow",
            label: "Vista móvil PosturaFit",
          },
          {
            src: "/screenshot-desktop.png",
            sizes: "978x1078",
            type: "image/png",
            form_factor: "wide",
            label: "Vista escritorio PosturaFit",
          },
        ],
      },
    }),
  ],
});
