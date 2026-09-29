import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// changeOrigin: false garde l’en-tête Host du navigateur, sinon l’API refuse
// les requêtes POST (vérification d’origine).
const api = { target: "http://127.0.0.1:3001", changeOrigin: false };
export default defineConfig({
  plugins: [react({ jsxImportSource: "react" })],
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": api,
      "/uploads": api,
    },
  },
});
