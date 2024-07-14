import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import environmentPlugin from 'vite-plugin-environment';

export default defineConfig({
  plugins: [
    react(),
    environmentPlugin({
      VITE_API_KEY: process.env.VITE_API_KEY,
      VITE_AUTH_DOMAIN: process.env.VITE_AUTH_DOMAIN,
      VITE_PROJECT_ID: process.env.VITE_PROJECT_ID,
      VITE_STORAGE_BUCKET: process.env.VITE_STORAGE_BUCKET,
      VITE_MESSAGING_SENDER_ID: process.env.VITE_MESSAGING_SENDER_ID,
      VITE_APP_ID: process.env.VITE_APP_ID,
      VITE_MEASUREMENT_ID: process.env.VITE_MEASUREMENT_ID
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
  