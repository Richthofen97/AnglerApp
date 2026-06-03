import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "AngelApp",
        short_name: "AngelApp",
        description: "Deine Angel App",
        theme_color: "#ffffff",
        icons: [
          {
            src: "/fisch.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/fisch.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
